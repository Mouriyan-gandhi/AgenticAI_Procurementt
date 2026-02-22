import os
import operator
import time
import certifi  # type: ignore

os.environ["SSL_CERT_FILE"] = certifi.where()
os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()

from typing import TypedDict, Annotated, Optional
from langgraph.graph import StateGraph, END  # type: ignore
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv  # type: ignore

from tools.pdf_parser import extract_text_from_pdf  # type: ignore
from agents.librarian import parse_requirements, parse_vendor_proposal
from agents.engineer import run_engineer  # type: ignore
from agents.compliance import run_compliance
from agents.scorer import run_scorer  # type: ignore
from agents.report import run_report_generator
from agents.negotiator import run_negotiator

load_dotenv()

# --- 1. State Definition ---
class EvalState(TypedDict):
    # Company requirements
    company_requirements_text: str
    company_requirements: dict

    # Vendor iteration
    vendor_files: list            # [(vendor_name, pdf_path), ...]
    current_vendor_index: int
    current_vendor_text: str
    current_vendor_proposal: dict

    # Audit results (per vendor)
    engineering_status: str
    engineering_notes: str
    compliance_status: str
    compliance_notes: str
    current_vendor_score: dict

    # Accumulated results
    all_evaluations: list

    # Output
    comparison_report: str

    # HITL
    manager_feedback: Optional[str]
    iteration_count: Annotated[int, operator.add]


# --- 2. Node Functions ---

def parse_requirements_node(state: EvalState):
    """Parse the company's internal requirements document."""
    print("\n[Node: Librarian] Parsing Company Requirements...")
    parsed = parse_requirements(state["company_requirements_text"])
    return {"company_requirements": parsed}


def load_vendor_node(state: EvalState):
    """Load the next vendor's proposal PDF."""
    idx = state.get("current_vendor_index", 0)
    vendor_files = state.get("vendor_files", [])

    if idx >= len(vendor_files): # type: ignore
        print("\n[Node: Load Vendor] All vendors processed!")
        return {}

    vendor_name, pdf_path = vendor_files[idx] # type: ignore
    print(f"\n{'='*60}")
    print(f"[Node: Load Vendor] Loading proposal {idx+1}/{len(vendor_files)}: {vendor_name}") # type: ignore
    print(f"{'='*60}")

    raw_text = extract_text_from_pdf(pdf_path)
    return {"current_vendor_text": raw_text}


def parse_vendor_node(state: EvalState):
    """Parse the current vendor's proposal using the Librarian."""
    idx = state.get("current_vendor_index", 0)
    vendor_files = state.get("vendor_files", [])

    if idx >= len(vendor_files):  # type: ignore
        print("\n[Node: Parse Vendor] No vendor to parse (index out of range). Skipping.")
        return {}

    vendor_name = vendor_files[idx][0]  # type: ignore
    print(f"\n[Node: Librarian] Parsing proposal from {vendor_name}...")

    parsed = parse_vendor_proposal(
        state["current_vendor_text"],
        state["company_requirements"],
    )
    return {"current_vendor_proposal": parsed}


def audit_vendor_node(state: EvalState):
    """Run Engineer + Compliance checks on the current vendor."""
    vendor_name = state["current_vendor_proposal"].get("vendor_name", "Unknown")
    print(f"[Node: Audit] Running Engineer & Compliance checks for {vendor_name}...")

    # Debug: show what the librarian extracted
    certs = state["current_vendor_proposal"].get("certifications", [])
    gaps = state["current_vendor_proposal"].get("key_gaps", [])
    print(f"   -> [DEBUG] Librarian extracted certs: {certs}")
    print(f"   -> [DEBUG] Librarian extracted gaps ({len(gaps)}): {gaps}")

    eng = run_engineer(state["current_vendor_proposal"], state["company_requirements"])
    comp = run_compliance(state["current_vendor_proposal"], state["company_requirements"])

    print(f"   -> [DEBUG] Engineer result: {eng['status']} | {eng['notes'][:80]}")
    print(f"   -> [DEBUG] Compliance result: {comp['status']} | {comp['notes'][:80]}")

    return {
        "engineering_status": eng["status"],
        "engineering_notes": eng["notes"],
        "compliance_status": comp["status"],
        "compliance_notes": comp["notes"],
    }


def score_vendor_node(state: EvalState):
    """Score the current vendor and accumulate results."""
    vendor_name = state["current_vendor_proposal"].get("vendor_name", "Unknown")
    print(f"[Node: Scorer] Scoring {vendor_name}...")

    score = run_scorer(
        vendor_proposal=state["current_vendor_proposal"],
        company_requirements=state["company_requirements"],
        engineering_result={"status": state["engineering_status"], "notes": state["engineering_notes"]},
        compliance_result={"status": state["compliance_status"], "notes": state["compliance_notes"]},
        manager_feedback=state.get("manager_feedback"),
    )

    # Negotiator
    print(f"[Node: Negotiator] Drafting counter-offer strategy for {vendor_name}...")
    strategy = run_negotiator(
        state["current_vendor_proposal"], 
        state["company_requirements"], 
        {"status": state["engineering_status"], "notes": state["engineering_notes"]},
        {"status": state["compliance_status"], "notes": state["compliance_notes"]},
        score
    )
    score["negotiation_strategy"] = strategy

    print(f"   -> {vendor_name}: Overall={score['overall_score']}, Tech={score['technical_score']}, "
          f"Compliance={score['compliance_score']}, Price={score['price_score']}")

    # Accumulate
    existing = list(state.get("all_evaluations", []) or []) # type: ignore
    existing.append(score)

    # Advance vendor index
    new_idx = state.get("current_vendor_index", 0) + 1 # type: ignore

    return {
        "current_vendor_score": score,
        "all_evaluations": existing,
        "current_vendor_index": new_idx,
    }


def check_more_vendors(state: EvalState):
    """Router: more vendors to evaluate, or all done?"""
    idx = state.get("current_vendor_index", 0)
    total = len(state.get("vendor_files", [])) # type: ignore
    if idx < total:
        return "next_vendor"
    return "all_done"


def rank_node(state: EvalState):
    """Generate the comparison report and ranking."""
    print("\n[Node: Ranker] Generating vendor comparison report...")
    report = run_report_generator(
        state.get("all_evaluations", []),
        state["company_requirements"],
    )
    return {"comparison_report": report, "iteration_count": 1}


def human_review_node(state: EvalState):
    """HITL pause point - manager reviews the ranking."""
    print("\n[HITL] Manager Review Complete. Proceeding...")
    return {}


def human_router(state: EvalState):
    """Route based on manager's decision."""
    if state.get("manager_feedback"):
        print("   -> Manager requested changes. Looping back...")
        return "re_evaluate"
    return "finalize"


def final_node(state: EvalState):
    """Final node - just marks completion."""
    print("\n[Node: Final] Evaluation pipeline complete!")
    return {}


# --- 3. Build Graph ---
def build_graph():
    workflow = StateGraph(EvalState)

    # Nodes
    workflow.add_node("parse_requirements", parse_requirements_node)
    workflow.add_node("load_vendor", load_vendor_node)
    workflow.add_node("parse_vendor", parse_vendor_node)
    workflow.add_node("audit_vendor", audit_vendor_node)
    workflow.add_node("score_vendor", score_vendor_node)
    workflow.add_node("rank", rank_node)
    workflow.add_node("human_review", human_review_node)
    workflow.add_node("final", final_node)

    # Edges
    workflow.set_entry_point("parse_requirements")
    workflow.add_edge("parse_requirements", "load_vendor")
    workflow.add_edge("load_vendor", "parse_vendor")
    workflow.add_edge("parse_vendor", "audit_vendor")
    workflow.add_edge("audit_vendor", "score_vendor")

    # After scoring: check if more vendors remain
    workflow.add_conditional_edges(
        "score_vendor",
        check_more_vendors,
        {
            "next_vendor": "load_vendor",   # Loop back for next vendor
            "all_done": "rank",             # All vendors scored -> rank
        },
    )

    workflow.add_edge("rank", "human_review")

    # HITL: manager approves or asks for changes
    workflow.add_conditional_edges(
        "human_review",
        human_router,
        {
            "re_evaluate": "parse_requirements",  # Re-run with feedback
            "finalize": "final",                   # Approved -> done
        },
    )

    workflow.add_edge("final", END)

    # Compile with HITL interrupt
    memory = MemorySaver()
    app = workflow.compile(checkpointer=memory, interrupt_before=["human_review"])
    return app


# --- 4. Discover Vendor Proposals ---
def discover_vendor_files(vendor_dir: str) -> list:
    """Scan a directory for vendor proposal PDFs."""
    vendor_files = []
    if not os.path.isdir(vendor_dir):
        print(f"Warning: Vendor directory '{vendor_dir}' not found.")
        return vendor_files

    for fname in sorted(os.listdir(vendor_dir)):
        if fname.lower().endswith(".pdf"):
            vendor_name = fname.replace("Vendor_", "").replace(".pdf", "").replace("_", " ")
            vendor_files.append((vendor_name, os.path.join(vendor_dir, fname)))
            print(f"   Found vendor: {vendor_name} ({fname})")

    return vendor_files


# --- 5. Run ---
if __name__ == "__main__":
    app = build_graph()

    print("\n" + "=" * 60)
    print("  AGENTIC VENDOR EVALUATION SYSTEM (Buyer Mode)")
    print("=" * 60)

    # 1. Load Company Requirements
    req_path = "Company_Requirements.pdf"
    if os.path.exists(req_path):
        print(f"\nFound company requirements: {req_path}")
        req_text = extract_text_from_pdf(req_path)
    else:
        req_text = "We need 500 tons of Steel, 200 tons of Aluminum. Budget: $850,000. Deadline: 2026-06-15."
        print("\nUsing fallback requirements text.")

    # 2. Discover Vendor Proposals
    print("\nScanning for vendor proposals...")
    vendor_files = discover_vendor_files("vendor_proposals")
    if not vendor_files:
        print("ERROR: No vendor proposals found in 'vendor_proposals/' directory!")
        exit(1)
    print(f"\nTotal vendors to evaluate: {len(vendor_files)}")

    # 3. Run the graph
    config = {"configurable": {"thread_id": "vendor_eval_001"}}
    initial_state = {
        "company_requirements_text": req_text,
        "vendor_files": vendor_files,
        "current_vendor_index": 0,
        "all_evaluations": [],
    }

    print("\n" + "-" * 60)
    print("Starting evaluation pipeline...")
    print("-" * 60)

    for event in app.stream(initial_state, config=config):
        pass  # All printing is done in nodes

    # 4. HITL Loop
    while True:
        state = app.get_state(config)  # type: ignore
        next_node = state.next
        if not next_node:
            print("\nExecution Finished! Check templates/output/Vendor_Comparison_Report.md")
            break

        if "human_review" in next_node:
            # Show the ranking summary
            evals = state.values.get("all_evaluations", [])
            ranked = sorted(evals, key=lambda x: x.get("overall_score", 0), reverse=True)

            print("\n" + "=" * 60)
            print("  MANAGER REVIEW: VENDOR RANKING")
            print("=" * 60)
            budget = state.values.get("company_requirements", {}).get("budget_limit_usd", 0)
            for i, ev in enumerate(ranked, 1):
                price = ev.get("proposed_price_usd", 0)
                budget_flag = " [OVER BUDGET]" if price > budget else ""
                print(f"  {i}. {ev.get('vendor_name', '?'):20s} | Overall: {ev.get('overall_score', 0):3d}/100 | "
                      f"Tech: {ev.get('technical_score', 0):3d} | Comply: {ev.get('compliance_score', 0):3d} | "
                      f"Price: {ev.get('price_score', 0):3d} | ${price:,.0f}{budget_flag}")
            print(f"\n  Budget: ${budget:,.0f}")
            print(f"  Recommended: {ranked[0].get('vendor_name', '?')}")
            print("=" * 60)

            user_input = input("\nManager Decision (type 'approve' or provide feedback): ").strip()

            if user_input.lower() == "approve":
                app.update_state(config, {"manager_feedback": None})  # type: ignore
                print("\nManager approved! Generating final report...")
            else:
                app.update_state(config, {    # type: ignore     
                    "manager_feedback": user_input,
                    "current_vendor_index": 0,
                    "all_evaluations": [],
                })  # type: ignore
                print(f"\nRe-evaluating with feedback: '{user_input}'")

            for event in app.stream(None, config=config):  # type: ignore
                pass
