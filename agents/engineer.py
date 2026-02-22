import os
import time
from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
from memory.project_memory import get_vector_store  # type: ignore


def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.2,
        timeout=120,
        max_retries=3,
    )


def run_engineer(vendor_proposal: dict, company_requirements: dict) -> dict:
    """
    Evaluates a vendor's proposal for TECHNICAL FEASIBILITY against our requirements.
    Checks: Do their materials match our required grades? Quantities sufficient?
    Returns: {'status': Pass/Flagged/Fail, 'notes': str}
    """
    llm = _get_llm()
    store = get_vector_store()

    # RAG: Check past experience with this vendor's offered materials
    offered = [m.get("material", "") for m in vendor_proposal.get("offered_materials", [])]
    if not offered:
        return {"status": "Fail", "notes": "No materials offered by vendor."}

    query = f"Past project issues or recommendations for materials: {', '.join(offered)}"
    print("   -> [DEBUG] Engineer: RAG similarity search...")
    t0 = time.time()
    retrieved_docs = store.similarity_search(query, k=2)
    print(f"   -> [DEBUG] Engineer: RAG search done in {time.time()-t0:.1f}s")
    context = "\n".join([doc.page_content for doc in retrieved_docs])

    required_mats = company_requirements.get("required_materials", [])

    system_prompt = """
    You are 'The Engineer'. You evaluate whether a VENDOR'S PROPOSAL meets the
    COMPANY'S TECHNICAL REQUIREMENTS.

    Check the following:
    1. Does the vendor offer ALL required materials?
    2. Do the material grades meet or exceed what we require?
    3. Are the quantities sufficient?
    4. Any red flags from past project history (RAG context)?

    Output format MUST be EXACTLY:
    STATUS: [Pass/Flagged/Fail]
    NOTES: [Your brief technical assessment]
    """

    human_msg = f"""
    COMPANY REQUIRED MATERIALS: {required_mats}

    VENDOR OFFERED MATERIALS: {vendor_proposal.get('offered_materials', [])}

    VENDOR NAME: {vendor_proposal.get('vendor_name', 'Unknown')}

    RAG Memory Context (past project history):
    {context}
    """

    try:
        print("   -> [DEBUG] Calling Gemini API for Engineer...")
        t0 = time.time()
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg),
        ])
        print(f"   -> [DEBUG] Engineer API response in {time.time()-t0:.1f}s")

        content_obj = response.content
        if isinstance(content_obj, list):
            output = " ".join(
                [block.get("text", "") if isinstance(block, dict) else str(block) for block in content_obj]
            )
        else:
            output = str(content_obj)

        output = output.strip()
        status_line = [l for l in output.split("\n") if l.strip().startswith("STATUS:")][0]
        notes_line = [l for l in output.split("\n") if l.strip().startswith("NOTES:")][0]

        status = status_line.split("STATUS:")[-1].strip()
        notes = notes_line.split("NOTES:")[-1].strip()

        if status not in ["Pass", "Flagged", "Fail"]:
            status = "Flagged"

        return {"status": status, "notes": notes}
    except Exception as e:
        print(f"   Engineer Error: {e}")
        return {"status": "Flagged", "notes": f"System error: {e}"}


if __name__ == "__main__":
    sample_proposal = {"vendor_name": "Test", "offered_materials": [{"material": "Steel", "grade": "A36", "quantity_tons": 500, "unit_price_usd": 850}]}
    sample_reqs = {"required_materials": [{"material": "Steel", "grade": "A36", "quantity_tons": 500}]}
    print(run_engineer(sample_proposal, sample_reqs))
