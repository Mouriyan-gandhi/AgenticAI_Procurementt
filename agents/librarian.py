import json
import time
import os
from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI  # type: ignore


def _get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.1,
        timeout=120,
        max_retries=3,
    )


def _invoke_and_parse_json(llm, messages: list) -> dict:
    """Helper: invoke LLM, strip markdown fences, parse JSON."""
    response = llm.invoke(messages)

    content_obj = response.content
    if isinstance(content_obj, list):
        content = " ".join(
            [
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content_obj
            ]
        )
    else:
        content = str(content_obj)

    content = content.strip()
    if content.startswith("```json"):
        content = content[7:] # type: ignore
    if content.startswith("```"):
        content = content[3:] # type: ignore
    if content.endswith("```"):
        content = content[:-3] # type: ignore

    return json.loads(content.strip())


def parse_requirements(raw_text: str) -> dict:
    """
    Parse the COMPANY's internal requirements document.
    Returns structured requirements JSON.
    """
    llm = _get_llm()

    system_prompt = """
    You are 'The Librarian', an expert data extraction agent.
    Read the company's internal procurement requirements document and extract
    a structured 'Requirement Matrix' in JSON format.

    You must output ONLY valid JSON matching this schema:
    {
        "project_name": "string",
        "required_materials": [
            {"material": "string", "grade": "string", "quantity_tons": number}
        ],
        "compliance_clauses": ["string list"],
        "budget_limit_usd": number | null,
        "deadline": "YYYY-MM-DD" | null,
        "priorities": ["string list"]
    }
    """

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Here is the company requirements document:\n\n{raw_text}"),
    ]

    try:
        print("   -> [DEBUG] Calling Gemini API for Requirements Parsing...")
        t0 = time.time()
        result = _invoke_and_parse_json(llm, messages)
        print(f"   -> [DEBUG] Requirements parsed in {time.time()-t0:.1f}s")
        return result
    except Exception as e:
        print(f"   Librarian Error (requirements): {e}")
        return {
            "error": str(e),
            "project_name": "Unknown",
            "required_materials": [],
            "compliance_clauses": [],
            "budget_limit_usd": None,
        }


def parse_vendor_proposal(raw_text: str, company_requirements: dict) -> dict:
    """
    Parse a VENDOR's proposal, mapping it against the company requirements.
    Returns structured vendor proposal JSON.
    """
    llm = _get_llm()

    system_prompt = f"""
    You are 'The Librarian', an expert data extraction agent.
    Read a vendor's proposal and extract structured data, comparing it against
    the company's requirements.

    COMPANY REQUIREMENTS FOR REFERENCE:
    {json.dumps(company_requirements, indent=2)}

    You must output ONLY valid JSON matching this schema:
    {{
        "vendor_name": "string",
        "offered_materials": [
            {{"material": "string", "grade": "string", "quantity_tons": number, "unit_price_usd": number}}
        ],
        "proposed_price_usd": number,
        "delivery_timeline": "string",
        "certifications": ["string list"],
        "key_strengths": ["string list - max 5"],
        "key_gaps": ["string list - ONLY technical and compliance gaps vs company requirements. Do NOT include pricing or delivery gaps here. Examples: missing certifications, wrong material grades, insufficient quantities, regulatory non-compliance. Empty list if none."]
    }}
    """

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Here is the vendor proposal:\n\n{raw_text}"),
    ]

    try:
        print("   -> [DEBUG] Calling Gemini API for Vendor Proposal Parsing...")
        t0 = time.time()
        result = _invoke_and_parse_json(llm, messages)
        print(f"   -> [DEBUG] Vendor proposal parsed in {time.time()-t0:.1f}s")
        return result
    except Exception as e:
        print(f"   Librarian Error (vendor proposal): {e}")
        return {
            "error": str(e),
            "vendor_name": "Unknown",
            "offered_materials": [],
            "proposed_price_usd": 0,
            "certifications": [],
            "key_strengths": [],
            "key_gaps": ["Failed to parse proposal"],
        }


if __name__ == "__main__":
    sample = "PROJECT NAME: Test. REQUIRED MATERIALS: Steel 100 tons. BUDGET: $500000. DEADLINE: 2026-06-15."
    print(parse_requirements(sample))
