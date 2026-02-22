import json
from langchain_core.prompts import ChatPromptTemplate # type: ignore
from langchain_google_genai import ChatGoogleGenerativeAI # type: ignore
import time

def run_negotiator(vendor_proposal: dict, company_requirements: dict, engineering_result: dict, compliance_result: dict, score_result: dict) -> dict:
    """
    Acts as the Negotiation Strategist.
    Identifies leverage points from technical gaps and compliance issues to generate a counter-offer strategy.
    """
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.2) # type: ignore

    prompt = ChatPromptTemplate.from_messages([
        ("system", """
You are an expert Procurement Negotiator and Strategic Buyer.
Your goal is to analyze the vendor's proposal, identify weaknesses (technical gaps, compliance missing, high price), and create a tactical negotiation strategy.

Output JSON with EXACTLY these keys:
- action_plan (string, short summary of the main negotiation angle)
- leverage_points (list of strings, specific facts to use against them to lower price e.g. "They lack SSO, demand 10% discount")
- suggested_counter_offer_usd (int, a realistic counter offer price)
- email_draft (string, a professional but firm 3-sentence email snippet to the vendor requesting these specific concessions)
"""),
        ("user", """
COMPANY BUDGET: {budget}
VENDOR PRICE: {vendor_price}
TECHNICAL GAPS: {engineer_notes}
COMPLIANCE ISSUES: {compliance_notes}

Provide the negotiation JSON.
""")
    ])

    budget = company_requirements.get("budget_limit_usd", 0)
    vendor_price = vendor_proposal.get("proposed_price_usd", 0)
    
    chain = prompt | llm
    
    try:
        # Give real-time perception for the UI
        time.sleep(1.5)
        response = chain.invoke({
            "budget": budget,
            "vendor_price": vendor_price,
            "engineer_notes": engineering_result.get("notes", "None"),
            "compliance_notes": compliance_result.get("notes", "None")
        })
        
        content = response.content # type: ignore
        content = content.replace("```json", "").replace("```", "").strip()
        data = json.loads(content)
        return data
    except Exception as e:
        print(f"Negotiator error: {e}")
        return {
            "action_plan": "Fallback strategy: request 10% standard discount.",
            "leverage_points": ["Budget constraints"],
            "suggested_counter_offer_usd": int(budget * 0.9),
            "email_draft": "Please review if there is any room to optimize your pricing by 10% to align with our budget."
        }
