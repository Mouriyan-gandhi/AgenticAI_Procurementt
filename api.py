"""
FastAPI Backend for the Agentic Vendor Evaluation System.
Wraps the existing agent pipeline into REST API endpoints with SSE streaming.
"""
import os
import certifi # type: ignore
import json
import uuid
import asyncio
import threading
import time
from queue import Queue, Empty
from typing import Optional

os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

from fastapi import FastAPI, HTTPException, UploadFile, File # type: ignore
import shutil
from fastapi.staticfiles import StaticFiles # type: ignore
from fastapi.responses import FileResponse, StreamingResponse # type: ignore
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel # type: ignore
from dotenv import load_dotenv

from tools.pdf_parser import extract_text_from_pdf # type: ignore
from agents.librarian import parse_requirements, parse_vendor_proposal
from agents.engineer import run_engineer # type: ignore
from agents.compliance import run_compliance
from agents.scorer import run_scorer # type: ignore
from agents.report import run_report_generator
from agents.negotiator import run_negotiator

load_dotenv()

# ─── App Setup ────────────────────────────────────────────
app = FastAPI(title="Agentic Vendor Evaluation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Store ─────────────────────────────────────
evaluations: dict = {}


class EvaluationState:
    """Tracks the state of a single evaluation pipeline run."""

    def __init__(self, eval_id: str):
        self.eval_id = eval_id
        self.status = "initializing"
        self.progress: list = []
        self.progress_queue: Queue = Queue()
        self.vendor_files: list = []
        self.requirements: dict = {}
        self.requirements_text: str = ""
        self.all_evaluations: list = []
        self.report: str = ""
        self.manager_feedback: Optional[str] = None
        self.review_event = threading.Event()
        self.current_vendor: str = ""
        self.current_step: str = ""
        self.vendors_total: int = 0
        self.vendors_completed: int = 0
        self.error: Optional[str] = None
        self.priorities: Optional[dict] = None  # {technical: 40, compliance: 30, price: 30}


def _log(state: EvaluationState, message: str, level: str = "info", data: dict = None): # type: ignore
    """Push a progress event to the evaluation queue."""
    event = {
        "timestamp": time.time(),
        "level": level,
        "message": message,
        "status": state.status,
        "vendor": state.current_vendor,
        "step": state.current_step,
        "vendors_completed": state.vendors_completed,
        "vendors_total": state.vendors_total,
    }
    if data:
        event["data"] = data # type: ignore
    state.progress.append(event)
    state.progress_queue.put(event)


# ─── Pipeline Runner ─────────────────────────────────────
def _evaluate_vendors(state: EvaluationState):
    """Evaluate all vendors (shared logic for first run and re-evaluation)."""
    for idx, (vendor_name, pdf_path) in enumerate(state.vendor_files):
        state.current_vendor = vendor_name
        state.vendors_completed = idx

        # Load PDF
        state.current_step = "loading"
        _log(state, f"Loading proposal from {vendor_name}...")
        raw_text = extract_text_from_pdf(pdf_path)

        # Parse proposal
        state.current_step = "parsing"
        _log(state, f"AI Librarian parsing proposal from {vendor_name}...")
        proposal = parse_vendor_proposal(raw_text, state.requirements)

        # Engineer audit
        state.current_step = "engineering"
        _log(state, f"Engineer running technical assessment for {vendor_name}...")
        eng = run_engineer(proposal, state.requirements)
        _log(state, f"Engineer: {eng['status']} — {eng['notes'][:100]}",
             data={"engineer_status": eng["status"]})

        # Compliance audit
        state.current_step = "compliance"
        _log(state, f"Compliance Officer checking certifications for {vendor_name}...")
        comp = run_compliance(proposal, state.requirements)
        _log(state, f"Compliance: {comp['status']} — {comp['notes'][:100]}",
             data={"compliance_status": comp["status"]})

        # Score
        state.current_step = "scoring"
        _log(state, f"Scorer evaluating {vendor_name}...")
        score = run_scorer(
            vendor_proposal=proposal,
            company_requirements=state.requirements,
            engineering_result=eng,
            compliance_result=comp,
            manager_feedback=state.manager_feedback,
            user_priorities=state.priorities,
        )

        # Negotiator
        state.current_step = "negotiating"
        _log(state, f"Negotiator drafting counter-offer strategy for {vendor_name}...")
        strategy = run_negotiator(proposal, state.requirements, eng, comp, score)
        score["negotiation_strategy"] = strategy

        state.all_evaluations.append(score)
        state.vendors_completed = idx + 1
        _log(state, f"✓ {vendor_name}: Overall={score['overall_score']}/10 "
             f"(Tech={score['technical_score']}, Comply={score['compliance_score']}, "
             f"Price={score['price_score']})",
             level="success",
             data={"score": score})


def run_pipeline(state: EvaluationState):
    """Run the full evaluation pipeline in a background thread."""
    try:
        while True:
            # ── Step 1: Parse Requirements ──
            state.status = "parsing_requirements"
            state.current_step = "requirements"
            state.current_vendor = ""
            _log(state, "AI Librarian parsing company requirements...")
            state.requirements = parse_requirements(state.requirements_text)
            _log(state, "✓ Requirements parsed successfully",
                 level="success",
                 data={"requirements": state.requirements})

            # ── Step 2: Evaluate all vendors ──
            state.status = "evaluating_vendors"
            _evaluate_vendors(state)

            # ── Step 3: Generate report ──
            state.status = "generating_report"
            state.current_step = "ranking"
            state.current_vendor = ""
            _log(state, "Generating vendor comparison report...")

            report = run_report_generator(state.all_evaluations, state.requirements)
            state.report = report

            ranked = sorted(state.all_evaluations,
                            key=lambda x: x.get("overall_score", 0), reverse=True)
            _log(state, "✓ Report generated. Awaiting manager review.",
                 level="success",
                 data={"rankings": ranked})

            # ── Step 4: Wait for manager review ──
            state.status = "awaiting_review"
            ranked = sorted(state.all_evaluations,
                            key=lambda x: x.get("overall_score", 0), reverse=True)
            _log(state, "Pipeline paused. Waiting for manager decision...",
                 level="review",
                 data={"rankings": ranked})
            state.review_event.wait()
            state.review_event.clear()

            if state.manager_feedback is None:
                # Approved
                state.status = "complete"
                _log(state, "✓ Manager approved! Evaluation finalized.",
                     level="success")
                break
            else:
                # Re-evaluate with feedback
                _log(state, f"Manager requested re-evaluation: '{state.manager_feedback}'",
                     level="warning")
                state.status = "re_evaluating"
                state.all_evaluations = []
                state.vendors_completed = 0
                _log(state, "Restarting evaluation with adjusted priorities...")
                # Loop continues → re-runs the pipeline

    except Exception as e:
        state.status = "error"
        state.error = str(e)
        _log(state, f"Pipeline error: {str(e)}", level="error")


# ─── API Endpoints ───────────────────────────────────────

class ReviewRequest(BaseModel):
    action: str  # "approve" or "feedback"
    feedback: Optional[str] = None


@app.get("/api/system/info")
async def system_info():
    """Get system info: available files, active evaluations."""
    req_path = "Company_Requirements.pdf"
    has_requirements = os.path.exists(req_path)

    vendor_dir = "vendor_proposals"
    vendors = []
    if os.path.isdir(vendor_dir):
        for fname in sorted(os.listdir(vendor_dir)):
            if fname.lower().endswith(".pdf"):
                name = fname.replace("Vendor_", "").replace(".pdf", "").replace("_", " ")
                vendors.append({"name": name, "file": fname})

    return {
        "has_requirements": has_requirements,
        "requirements_file": req_path if has_requirements else None,
        "vendors": vendors,
        "active_evaluations": list(evaluations.keys()),
    }


@app.post("/api/upload/requirements")
async def upload_requirements(file: UploadFile = File(...)):
    """Upload company requirements PDF."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    dest = "Company_Requirements.pdf"
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"status": "ok", "filename": dest, "size": os.path.getsize(dest)}


@app.post("/api/upload/vendor")
async def upload_vendor(file: UploadFile = File(...)):
    """Upload a vendor proposal PDF."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    vendor_dir = "vendor_proposals"
    os.makedirs(vendor_dir, exist_ok=True)

    dest = os.path.join(vendor_dir, file.filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {"status": "ok", "filename": file.filename, "size": os.path.getsize(dest)}


@app.delete("/api/upload/vendor/{filename}")
async def delete_vendor(filename: str):
    """Remove a vendor proposal."""
    path = os.path.join("vendor_proposals", filename)
    if os.path.exists(path):
        os.remove(path)
        return {"status": "ok"}
    raise HTTPException(404, "File not found")


class StartRequest(BaseModel):
    priorities: Optional[dict] = None  # {technical: 40, compliance: 30, price: 30}


@app.post("/api/evaluate/start")
async def start_evaluation(body: StartRequest = StartRequest()):
    """Start a new evaluation pipeline."""
    req_path = "Company_Requirements.pdf"
    if not os.path.exists(req_path):
        raise HTTPException(400, "Company_Requirements.pdf not found")

    req_text = extract_text_from_pdf(req_path)

    vendor_dir = "vendor_proposals"
    vendor_files = []
    if os.path.isdir(vendor_dir):
        for fname in sorted(os.listdir(vendor_dir)):
            if fname.lower().endswith(".pdf"):
                name = fname.replace("Vendor_", "").replace(".pdf", "").replace("_", " ")
                vendor_files.append((name, os.path.join(vendor_dir, fname)))

    if not vendor_files:
        raise HTTPException(400, "No vendor proposals found in vendor_proposals/")

    eval_id = str(uuid.uuid4())[:8] # type: ignore
    state = EvaluationState(eval_id)
    state.requirements_text = req_text
    state.vendor_files = vendor_files
    state.vendors_total = len(vendor_files)
    state.priorities = body.priorities
    evaluations[eval_id] = state

    thread = threading.Thread(target=run_pipeline, args=(state,), daemon=True)
    thread.start()

    return {
        "eval_id": eval_id,
        "vendors": [v[0] for v in vendor_files],
        "vendors_total": len(vendor_files),
        "status": "started",
    }


@app.get("/api/evaluate/{eval_id}/stream")
async def stream_progress(eval_id: str):
    """SSE endpoint for real-time progress streaming."""
    if eval_id not in evaluations:
        raise HTTPException(404, "Evaluation not found")

    state = evaluations[eval_id]

    async def event_generator():
        while True:
            try:
                msg = state.progress_queue.get_nowait()
                yield f"data: {json.dumps(msg)}\n\n"
            except Empty:
                if state.status in ("complete", "error"):
                    final = {
                        "status": state.status,
                        "message": "Pipeline finished",
                        "level": "complete",
                    }
                    yield f"data: {json.dumps(final)}\n\n"
                    break
                await asyncio.sleep(0.3)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/evaluate/{eval_id}/status")
async def get_status(eval_id: str):
    """Get the current status of an evaluation."""
    if eval_id not in evaluations:
        raise HTTPException(404, "Evaluation not found")

    state = evaluations[eval_id]
    result = {
        "eval_id": eval_id,
        "status": state.status,
        "vendors_total": state.vendors_total,
        "vendors_completed": state.vendors_completed,
        "current_vendor": state.current_vendor,
        "current_step": state.current_step,
    }

    if state.status in ("awaiting_review", "complete"):
        ranked = sorted(state.all_evaluations,
                        key=lambda x: x.get("overall_score", 0), reverse=True)
        result["rankings"] = ranked
        result["requirements"] = state.requirements
        result["report"] = state.report

    if state.error:
        result["error"] = state.error

    return result


@app.post("/api/evaluate/{eval_id}/review")
async def submit_review(eval_id: str, review: ReviewRequest):
    """Submit manager review (approve or request re-evaluation)."""
    if eval_id not in evaluations:
        raise HTTPException(404, "Evaluation not found")

    state = evaluations[eval_id]
    if state.status != "awaiting_review":
        raise HTTPException(400, f"Evaluation is not awaiting review (status: {state.status})")

    if review.action == "approve":
        state.manager_feedback = None
    else:
        state.manager_feedback = review.feedback or "Re-evaluate"

    state.review_event.set()

    return {"status": "ok", "action": review.action}


# ─── Static Files ────────────────────────────────────────
os.makedirs("static/css", exist_ok=True)
os.makedirs("static/js", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")


# ─── Run ─────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn # type: ignore
    print("\n" + "=" * 60)
    print("  AGENTIC VENDOR EVALUATION SYSTEM — Web Interface")
    print("  Open: http://localhost:8000")
    print("=" * 60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
