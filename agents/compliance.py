import os
import time
from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore
from memory.project_memory import get_vector_store  # type: ignore


def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.1,
        timeout=120,
        max_retries=3,
    )


def run_compliance(vendor_proposal: dict, company_requirements: dict) -> dict:
    """
    Checks whether the VENDOR'S PROPOSAL complies with OUR company policies.
    Checks: certifications, conflict minerals, ISO standards, MTR inclusion.
    Returns: {'status': Pass/Flagged/Fail, 'notes': str}
    """
    llm = _get_llm()
    store = get_vector_store()

    certs = vendor_proposal.get("certifications", [])
    our_clauses = company_requirements.get("compliance_clauses", [])

    # RAG: Check company policies
    query = f"Company policy on certifications: {', '.join(certs)} and compliance clauses: {', '.join(our_clauses)}"
    print("   -> [DEBUG] Compliance: RAG similarity search...")
    t0 = time.time()
    retrieved_docs = store.similarity_search(query, k=2)
    print(f"   -> [DEBUG] Compliance: RAG search done in {time.time()-t0:.1f}s")
    context = "\n".join([doc.page_content for doc in retrieved_docs])

    system_prompt = """
    You are 'The Compliance Officer'. You evaluate whether a VENDOR'S PROPOSAL
    meets the COMPANY'S REGULATORY AND CERTIFICATION requirements.

    IMPORTANT: You ONLY evaluate REGULATORY and CERTIFICATION compliance.
    Do NOT consider pricing, budget, delivery timelines, or commercial terms.
    Those are evaluated by other agents.

    Check the following:
    1. Does the vendor hold ALL required certifications (ISO 9001:2015, ISO 14001:2015, etc.)?
    2. Is the vendor compliant with conflict mineral policies (Dodd-Frank Section 1502)?
    3. Does the vendor include Material Test Reports (MTR) per EN 10204 Type 3.1?
    4. Are there any regulatory red flags (country of origin, environmental compliance)?
    5. Check against company policy context from RAG memory.

    Scoring guide:
    - Pass: Vendor meets ALL mandatory certification and regulatory requirements
    - Flagged: Vendor meets most but is missing one non-critical certification (e.g. AS9100D which is preferred but not mandatory)
    - Fail: Vendor is missing a MANDATORY certification (ISO 9001 or ISO 14001) or has critical regulatory issues

    Output format MUST be EXACTLY:
    STATUS: [Pass/Flagged/Fail]
    NOTES: [Your brief compliance assessment - focus on certifications and regulations only]
    """

    human_msg = f"""
    OUR COMPLIANCE REQUIREMENTS: {our_clauses}

    VENDOR CERTIFICATIONS: {certs}
    VENDOR NAME: {vendor_proposal.get('vendor_name', 'Unknown')}

    Company Policy Context (RAG):
    {context}
    """

    try:
        print("   -> [DEBUG] Calling Gemini API for Compliance...")
        t0 = time.time()
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=human_msg),
        ])
        print(f"   -> [DEBUG] Compliance API response in {time.time()-t0:.1f}s")

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

        # Normalize status (case-insensitive matching)
        status_normalized = status.strip().capitalize()
        if status_normalized not in ["Pass", "Flagged", "Fail"]:
            status_normalized = "Flagged"

        return {"status": status_normalized, "notes": notes}
    except Exception as e:
        print(f"   Compliance Error: {e}")
        return {"status": "Flagged", "notes": f"System error: {e}"}


if __name__ == "__main__":
    sample_proposal = {"vendor_name": "Test", "certifications": ["ISO 9001:2015"]}
    sample_reqs = {"compliance_clauses": ["ISO 9001:2015", "ISO 14001"]}
    print(run_compliance(sample_proposal, sample_reqs))
