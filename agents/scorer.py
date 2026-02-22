"""
Scorer Agent: Replaces the old Pricer.
Scores each vendor proposal on Technical, Compliance, and Price dimensions.
Cross-checks vendor prices against live market data.
"""
from typing import Optional
import os
from langchain_google_genai import ChatGoogleGenerativeAI # type: ignore
from langchain_core.messages import SystemMessage, HumanMessage # type: ignore
from tools.market_scraper import validate_vendor_prices  # type: ignore


def _adjust_weights(feedback: Optional[str] = None, user_priorities: Optional[dict] = None) -> tuple:
    """
    Adjusts scoring weights (Tech, Compliance, Price) based on user-set priorities and manager feedback.
    User priorities come from the slider UI: {technical: 40, compliance: 30, price: 30}
    They are normalized to sum to 1.0.
    """
    # Start with user-defined priorities if available
    if user_priorities:
        t = user_priorities.get('technical', 40)
        c = user_priorities.get('compliance', 30)
        p = user_priorities.get('price', 30)
        total = t + c + p
        if total > 0:
            tech_w = t / total
            comp_w = c / total
            price_w = p / total
        else:
            tech_w, comp_w, price_w = 0.4, 0.3, 0.3
    else:
        tech_w, comp_w, price_w = 0.4, 0.3, 0.3

    if not feedback:
        return tech_w, comp_w, price_w

    feedback_lower = feedback.lower()

    price_keywords = ["cost", "price", "budget", "cheap", "lowest", "affordable",
                      "economical", "least", "expense", "quotation", "low cost",
                      "inexpensive", "saving"]
    tech_keywords = ["technical", "quality", "engineering", "performance",
                     "capability", "tech", "specification", "grade"]
    comp_keywords = ["compliance", "certification", "regulatory", "safety",
                     "standard", "iso", "audit", "policy"]

    price_boost = sum(1 for kw in price_keywords if kw in feedback_lower)
    tech_boost = sum(1 for kw in tech_keywords if kw in feedback_lower)
    comp_boost = sum(1 for kw in comp_keywords if kw in feedback_lower)

    total_boost = price_boost + tech_boost + comp_boost
    if total_boost == 0:
        return tech_w, comp_w, price_w

    # Only price priority
    if price_boost > 0 and tech_boost == 0 and comp_boost == 0:
        tech_w, comp_w, price_w = 0.20, 0.20, 0.60
    # Only tech priority
    elif tech_boost > 0 and price_boost == 0 and comp_boost == 0:
        tech_w, comp_w, price_w = 0.60, 0.20, 0.20
    # Only compliance priority
    elif comp_boost > 0 and price_boost == 0 and tech_boost == 0:
        tech_w, comp_w, price_w = 0.20, 0.60, 0.20
    # Price + Tech priority
    elif price_boost > 0 and tech_boost > 0 and comp_boost == 0:
        tech_w, comp_w, price_w = 0.35, 0.15, 0.50
    # Price + Compliance priority
    elif price_boost > 0 and comp_boost > 0 and tech_boost == 0:
        tech_w, comp_w, price_w = 0.15, 0.35, 0.50
    # Tech + Compliance priority
    elif tech_boost > 0 and comp_boost > 0 and price_boost == 0:
        tech_w, comp_w, price_w = 0.35, 0.50, 0.15
    # All three mentioned
    else:
        tech_w, comp_w, price_w = 0.33, 0.33, 0.34

    print(f"   -> [Scorer] Adjusted weights from feedback: Tech={tech_w:.0%}, Compliance={comp_w:.0%}, Price={price_w:.0%}")
    return tech_w, comp_w, price_w


def run_scorer(vendor_proposal: dict, company_requirements: dict,
               engineering_result: dict, compliance_result: dict,
               manager_feedback: Optional[str] = None,
               user_priorities: Optional[dict] = None) -> dict:
    """
    Scores a vendor proposal based on audit results and price comparison.
    Returns scores out of 10 for each dimension + weighted overall score.
    """

    # --- 1. Technical Score (0-10) ---
    eng_status = engineering_result.get("status", "Flagged")
    tech_score_map = {"Pass": 9.0, "Flagged": 6.0, "Fail": 2.0}
    tech_score = tech_score_map.get(eng_status, 5.0)

    # Bonus: check material coverage
    required_mats = {m["material"].lower() for m in company_requirements.get("required_materials", [])}
    offered_mats = {m["material"].lower() for m in vendor_proposal.get("offered_materials", [])}
    coverage = len(required_mats & offered_mats) / max(len(required_mats), 1)
    tech_score = min(10.0, round(float(tech_score * (0.5 + 0.5 * coverage)), 1))

    # --- 2. Compliance Score (0-10) ---
    comp_status = compliance_result.get("status", "Flagged")
    comp_score_map = {"Pass": 9.0, "Flagged": 5.5, "Fail": 1.5}
    comp_score = comp_score_map.get(comp_status, 5.0)

    # Programmatic certification verification (overrides overly strict LLM)
    vendor_certs = vendor_proposal.get("certifications", [])
    # Filter out certs that are "in progress", "pending", "expected", etc.
    active_certs = [c for c in vendor_certs
                    if not any(neg in c.lower() for neg in
                               ["in progress", "pending", "application", "expected", "not yet"])]
    certs_lower = " ".join(c.lower() for c in active_certs)

    has_iso_9001 = "9001" in certs_lower
    has_iso_14001 = "14001" in certs_lower
    has_conflict_minerals = any(kw in certs_lower for kw in ["dodd-frank", "conflict mineral", "cmrt"])
    has_mtr = any(kw in certs_lower for kw in ["mtr", "en 10204", "mill test"])

    # Build a fact-based compliance score (out of 10)
    cert_score = 0.0
    if has_iso_9001:
        cert_score += 3.5       # Mandatory cert
    if has_iso_14001:
        cert_score += 3.5       # Mandatory cert
    if has_conflict_minerals:
        cert_score += 1.5       # Required policy
    if has_mtr:
        cert_score += 1.5       # Required documentation

    # Use the HIGHER of LLM score vs programmatic score
    comp_score = min(10.0, round(float(max(comp_score, cert_score)), 1))
    print(f"   -> [DEBUG] Compliance: LLM={comp_status}, "
          f"Certs=[9001:{has_iso_9001}, 14001:{has_iso_14001}], "
          f"CertScore={cert_score}, Final={comp_score}")

    # --- 3. Price Score (0-10) ---
    budget = company_requirements.get("budget_limit_usd") or 1_000_000
    proposed_price = vendor_proposal.get("proposed_price_usd", 0)
    if proposed_price is None:
        proposed_price = 0

    if proposed_price <= 0:
        price_score = 0.0
    elif proposed_price <= budget:
        # Under budget = good. Closer to budget = lower score
        price_score = 10.0 * (1 - proposed_price / budget) + 5.0
        price_score = min(10.0, round(float(price_score), 1))
    else:
        # Over budget = penalty
        over_ratio = proposed_price / budget
        price_score = max(0.0, round(float(10.0 - (over_ratio - 1) * 10.0), 1))

    # --- 3b. Market Price Validation ---
    offered_materials = vendor_proposal.get("offered_materials", [])
    market_validation = validate_vendor_prices(offered_materials)

    # Penalize overpriced materials (1 point per overpriced item)
    overpriced_count = sum(1 for m in market_validation if m.get("verdict") == "OVERPRICED")
    price_score = max(0.0, round(float(price_score - overpriced_count * 1.0), 1))

    # --- 4. Overall Weighted Score (dynamically adjusted, 0-10) ---
    tech_w, comp_w, price_w = _adjust_weights(manager_feedback, user_priorities)
    overall = round(float(tech_score * tech_w + comp_score * comp_w + price_score * price_w), 1)

    # --- 5. Generate AI Justification ---
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3
        )
        prompt = f"""You are an expert Enterprise Procurement Scorer.
Evaluate this vendor against the 0-10 STANDARD SCORING RUBRIC below.

RUBRIC DEFNITIONS (1-10 Scale):
- 1-3: Fails basic requirements. Major gaps.
- 4-6: Meets minimum requirements but has significant caveats or lacks key certifications/optimizations.
- 7-8: Solid proposal. Meets all core requirements.
- 9: Excellent. Meets all requirements with additional value (e.g., great price, extra certs).
- 10: Perfect. Meets all core requirements AND provides exceptional additional value/alignment.

EVALUATION PARAMETERS:
1. **Total Cost of Ownership (TCO) & Value (Weight: {price_w*100}%)**: Evaluates raw price vs budget constraints and market viability.
2. **Quality & Capabilities (Weight: {tech_w*100}%)**: Evaluates how well the offered materials/services meet strict technical specifications.
3. **Risk & Regulatory Compliance (Weight: {comp_w*100}%)**: Evaluates adherence to critical industry standards (ISO, Conflict Minerals).

VENDOR DATA:
Vendor: {vendor_proposal.get('vendor_name', 'Unknown')}
Final Weighted Score: {overall}/10
Internal Sub-Scores:
- Technical Metric: {tech_score}/10 
- Compliance Metric: {comp_score}/10 
- Price Metric: {price_score}/10 

Auditor Notes on Quality/Capabilities: {engineering_result.get('notes', 'None')}
Auditor Notes on Risk/Compliance: {compliance_result.get('notes', 'None')}

Write a highly professional 2-3 sentence executive summary explaining why the vendor received a {overall}/10. Explain what specific criteria were satisfied (or missed) based on the 1-10 Rubric Definitions and the specific sub-scores/notes provided.
"""
        dt = llm.invoke([HumanMessage(content=prompt)])
        justification = dt.content.strip() if hasattr(dt, "content") else str(dt).strip()
    except Exception as e:
        justification = f"Scoring executed programmatically based on priorities. Technical: {tech_score}, Compliance: {comp_score}, Price: {price_score}. (AI rationale unavailable)"
    overall = round(float(tech_score * tech_w + comp_score * comp_w + price_score * price_w), 1)

    return {
        "vendor_name": vendor_proposal.get("vendor_name", "Unknown"),
        "technical_score": tech_score,
        "compliance_score": comp_score,
        "price_score": price_score,
        "overall_score": overall,
        "proposed_price_usd": proposed_price,
        "budget_limit_usd": budget,
        "engineering_notes": engineering_result.get("notes", ""),
        "compliance_notes": compliance_result.get("notes", ""),
        "market_validation": market_validation,
        "justification": justification,
    }


if __name__ == "__main__":
    sample = run_scorer(
        vendor_proposal={"vendor_name": "Test", "offered_materials": [{"material": "Steel"}], "proposed_price_usd": 700000, "key_gaps": []},
        company_requirements={"required_materials": [{"material": "Steel"}], "budget_limit_usd": 850000},
        engineering_result={"status": "Pass", "notes": "All good"},
        compliance_result={"status": "Flagged", "notes": "Missing ISO 14001"},
    )
    print(sample)
