"""
Generate realistic fake PDF test data for the Agentic Vendor Evaluation System.
Creates: Company_Requirements.pdf, Company_Knowledge_Base.pdf, and 3 vendor proposals.
"""
import pymupdf  # type: ignore
import os


def create_pdf(filepath: str, title: str, content: str):
    """Create a formatted PDF with title and content."""
    doc = pymupdf.open()

    # Split content into pages if too long
    lines = content.strip().split("\n")
    lines_per_page = 52
    page_chunks = [lines[i:i + lines_per_page] for i in range(0, len(lines), lines_per_page)]  # type: ignore

    for chunk_idx, chunk in enumerate(page_chunks):
        page = doc.new_page(width=612, height=792)  # US Letter

        # Title on first page only
        y_offset = 50
        if chunk_idx == 0:
            page.insert_text(
                pymupdf.Point(50, y_offset),
                title,
                fontsize=16,
                fontname="helv",
                color=(0.1, 0.2, 0.5),
            )
            y_offset = 80
            # Divider line
            page.draw_line(pymupdf.Point(50, y_offset), pymupdf.Point(562, y_offset),
                           color=(0.3, 0.3, 0.3), width=1)
            y_offset = 100

        for line in chunk:
            stripped = line.strip()

            # Section headers (lines starting with ##)
            if stripped.startswith("## "):
                y_offset += 8
                page.insert_text(
                    pymupdf.Point(50, y_offset),
                    stripped[3:],
                    fontsize=12,
                    fontname="helv",
                    color=(0.1, 0.3, 0.6),
                )
                y_offset += 6
            # Sub-headers
            elif stripped.startswith("### "):
                y_offset += 4  # type: ignore
                page.insert_text(
                    pymupdf.Point(60, y_offset),
                    stripped[4:],
                    fontsize=10,
                    fontname="helv",
                    color=(0.2, 0.2, 0.2),
                )
                y_offset += 4
            # Regular text
            else:
                page.insert_text(
                    pymupdf.Point(60, y_offset),
                    stripped,
                    fontsize=9,
                    fontname="helv",
                    color=(0.1, 0.1, 0.1),
                )

            y_offset += 13

    doc.save(filepath)
    doc.close()
    print(f"  Created: {filepath} ({len(page_chunks)} page(s))")


# ============================================================
# 1. COMPANY REQUIREMENTS
# ============================================================
COMPANY_REQUIREMENTS = """
## PROJECT OVERVIEW
Project Name: Gulf Industrial Manufacturing Expansion (GIME-2026)
Issued By: Meridian Heavy Industries LLC
Date Issued: January 15, 2026
RFQ Reference: MHI-RFQ-2026-0042
Submission Deadline: March 1, 2026

## PROJECT DESCRIPTION
Meridian Heavy Industries is undertaking a major expansion of its Gulf Coast manufacturing
facility in Houston, Texas. This expansion includes new fabrication bays, structural steel
framing for an 80,000 sq ft facility, aluminum cladding and facade systems, and copper
electrical bus bar systems for the new power distribution network.

We are seeking qualified vendors to supply raw materials meeting our exact specifications.
All materials must be delivered to our Houston facility by the deadline specified below.

## REQUIRED MATERIALS

### Material 1: Structural Steel
- Type: Hot-Rolled Structural Steel
- Grade: ASTM A36 / A992 (W-shapes and plates)
- Quantity: 500 metric tons
- Specifications: Mill Test Reports (MTR) required for every heat lot
- Surface: Blast-cleaned to SSPC-SP6 Commercial Blast
- Notes: Must be domestic (USA) or NATO-allied country origin

### Material 2: Aluminum
- Type: Aluminum Alloy Sheet and Extrusions
- Grade: 6061-T6 (sheets), 6063-T5 (extrusions)
- Quantity: 200 metric tons
- Specifications: Per ASTM B209 (sheet) and ASTM B221 (extrusions)
- Surface: Mill finish, suitable for anodizing
- Notes: No recycled content exceeding 30%

### Material 3: Copper
- Type: Electrolytic Tough Pitch Copper (ETP)
- Grade: C11000 (UNS)
- Quantity: 50 metric tons
- Specifications: Per ASTM B152 (sheet/plate) and ASTM B187 (bus bar)
- Conductivity: Minimum 100% IACS
- Notes: Must include conductivity test certificates

## BUDGET AND COMMERCIAL TERMS
- Total Budget Limit: $850,000 USD (all materials combined, delivered)
- Payment Terms: Net 60 from delivery acceptance
- Delivery Terms: DDP Houston, TX (Incoterms 2020)
- Currency: All quotes must be in USD

## DELIVERY REQUIREMENTS
- Final Delivery Deadline: June 15, 2026
- Partial Shipments: Acceptable with prior approval
- Steel must arrive by May 15, 2026 (for early foundation work)
- Packaging: Export-grade packaging to prevent transit damage

## COMPLIANCE REQUIREMENTS

### Mandatory Certifications
1. ISO 9001:2015 - Quality Management System (current, valid certificate required)
2. ISO 14001:2015 - Environmental Management System (current, valid certificate required)

### Regulatory Compliance
3. Conflict Mineral Policy: Vendor must certify compliance with Dodd-Frank Section 1502
   and provide a Conflict Minerals Reporting Template (CMRT) if applicable.
4. Material Test Reports (MTR): Required for ALL metallic materials per EN 10204 Type 3.1
5. REACH/RoHS: Materials must comply with EU REACH and RoHS directives if applicable.

### Additional Requirements
6. Country of Origin documentation required for all materials
7. Vendor must have a documented HSE (Health, Safety & Environment) program
8. Preference given to vendors with AS9100D aerospace quality certification
9. All materials must be traceable to the original mill/foundry

## EVALUATION CRITERIA
Proposals will be evaluated on the following weighted criteria:
- Technical Compliance: 40% (material grades, quantities, specifications match)
- Regulatory & Certification Compliance: 30% (ISO certs, conflict minerals, MTR)
- Commercial Competitiveness: 30% (pricing vs. budget, payment terms, delivery)

## SUBMISSION INSTRUCTIONS
Vendors must submit proposals including:
1. Completed pricing schedule with unit prices and total cost
2. Copies of current ISO 9001 and ISO 14001 certificates
3. Delivery schedule with milestones
4. Technical datasheets for all offered materials
5. Company profile and references from similar projects
"""


# ============================================================
# 2. COMPANY KNOWLEDGE BASE
# ============================================================
COMPANY_KNOWLEDGE_BASE = """
## MERIDIAN HEAVY INDUSTRIES - CORPORATE KNOWLEDGE BASE
## Document Version: 3.2 | Last Updated: December 2025

## COMPANY PROFILE
Meridian Heavy Industries LLC (MHI) is a Houston-based industrial manufacturing company
specializing in heavy structural fabrication, modular construction, and industrial equipment
manufacturing. Founded in 2008, MHI has completed over 200 major projects across the
oil & gas, petrochemical, power generation, and infrastructure sectors.

## APPROVED VENDOR HISTORY

### AlphaTech Industries (Vendor since 2019)
- Supplied steel and aluminum for the Baytown Refinery Expansion (2021)
- Quality: Excellent. All MTRs provided on time. Zero defects reported.
- Pricing: Tends to be 15-25% above market average. Premium vendor.
- Delivery: Reliable. Met all delivery deadlines in 3 out of 3 past orders.
- Certifications: ISO 9001, ISO 14001, AS9100D, IATF 16949
- Notes: Preferred vendor for aerospace-grade materials. Expensive but reliable.
- Past Issue: None significant. Minor packaging damage on one 2022 shipment (resolved).

### BetaCorp Solutions Ltd. (Vendor since 2022)
- Supplied steel plates for the Port Arthur Module Yard (2023)
- Quality: Acceptable. One batch of A36 plates had surface rust upon arrival.
  Root cause: inadequate packaging for maritime transit.
- Pricing: Very competitive. Typically 10-15% below market average.
- Delivery: Inconsistent. Missed deadline by 3 weeks on the Port Arthur order.
  Caused a 2-week project delay costing MHI approximately $180,000 in penalties.
- Certifications: ISO 9001 only. Does NOT hold ISO 14001.
- Notes: Budget option. Use with caution. Require enhanced inspection protocols.
- Past Issue: Late delivery on Port Arthur project. Surface quality concerns.

### GammaMfg Corporation (Vendor since 2020)
- Supplied steel, aluminum, and copper for the Lake Charles Power Plant (2024)
- Quality: Good. All materials met specifications. Minor dimensional variance on
  some aluminum extrusions (within tolerance but noted for future reference).
- Pricing: Competitive and fair. Typically within 5% of market rates.
- Delivery: Good. Met deadlines on 4 out of 5 past orders. One order was 4 days late
  due to shipping logistics (not production delay).
- Certifications: ISO 9001, ISO 14001
- Notes: Solid middle-ground vendor. Good balance of quality and price.
- Past Issue: Minor aluminum dimensional variance (2024). 4-day late delivery (2023).

## PROCUREMENT POLICIES

### Policy P-001: Vendor Qualification
All vendors supplying materials for structural or safety-critical applications must hold
at minimum ISO 9001:2015 certification. ISO 14001:2015 is required for projects with
environmental impact assessments. Vendors lacking ISO 14001 may be conditionally approved
for non-environmental projects only, subject to VP of Operations approval.

### Policy P-002: Conflict Minerals
Meridian Heavy Industries is committed to responsible sourcing. All vendors must provide
a signed declaration of compliance with the Dodd-Frank Wall Street Reform Act, Section 1502.
Vendors sourcing materials from DRC (Democratic Republic of Congo) or adjoining countries
must provide a completed CMRT (Conflict Minerals Reporting Template).

### Policy P-003: Material Traceability
All metallic materials must be accompanied by Mill Test Reports (MTR) per EN 10204 Type 3.1.
Materials without MTR documentation will be rejected at receiving inspection. No exceptions.

### Policy P-004: Budget Overruns
Vendor proposals exceeding the stated budget by more than 10% will be automatically
disqualified unless the vendor can demonstrate unique technical capabilities not available
from other sources. Proposals 5-10% over budget may be considered with VP approval.

### Policy P-005: Delivery Performance
Vendors with a history of late deliveries (>2 incidents in past 3 years) must provide
a detailed logistics plan and may be required to post a performance bond of 5% of the
contract value. Liquidated damages of 1% per week of delay apply to all contracts.

### Policy P-006: Health, Safety & Environment (HSE)
All vendors must maintain a documented HSE management system. Vendors performing on-site
deliveries must comply with MHI's site-specific safety requirements including PPE standards,
vehicle inspection protocols, and delivery scheduling through the logistics coordinator.

## LESSONS LEARNED FROM PAST PROJECTS

### Baytown Refinery Expansion (2021)
- Used AlphaTech for steel. Premium pricing but zero quality issues.
- Lesson: Budget for premium materials on safety-critical structural components.

### Port Arthur Module Yard (2023)
- Used BetaCorp for steel plates. Saved $120,000 on material cost.
- However, 3-week delivery delay caused $180,000 in project penalties.
- Net loss: $60,000. Lesson: Cheapest is not always best. Factor delivery risk.

### Lake Charles Power Plant (2024)
- Used GammaMfg for all three material categories. 
- Best overall experience. Good quality, fair pricing, reliable delivery. 
- Lesson: Single-source vendors simplify logistics and accountability.

## MARKET INTELLIGENCE (Q4 2025)

### Steel Market
- Current market price: $840-880/ton for A36 structural steel (domestic)
- Trend: Stable with slight upward pressure due to infrastructure bill demand
- Lead times: 6-10 weeks typical for structural shapes

### Aluminum Market
- Current market price: $2,300-2,500/ton for 6061-T6 sheet
- Trend: Volatile. LME aluminum has fluctuated 8% in Q4 2025
- Lead times: 8-12 weeks for custom extrusions, 4-6 weeks for standard sheet

### Copper Market
- Current market price: $8,800-9,100/ton for C11000 ETP copper
- Trend: Rising due to electrification and data center demand
- Lead times: 4-8 weeks for bus bar, 2-4 weeks for sheet
"""


# ============================================================
# 3. VENDOR PROPOSALS
# ============================================================

VENDOR_ALPHATECH = """
## ALPHATECH INDUSTRIES - PROPOSAL RESPONSE
## RFQ Reference: MHI-RFQ-2026-0042

## COMPANY OVERVIEW
AlphaTech Industries is a Tier-1 metals distributor and manufacturer headquartered in
Pittsburgh, PA. Established in 1995, we serve the aerospace, defense, energy, and heavy
industrial sectors with premium-grade metals and alloys. We operate three distribution
centers (Pittsburgh, Houston, and Los Angeles) with combined inventory of 45,000+ tons.

## CERTIFICATIONS & COMPLIANCE
- ISO 9001:2015 (Certificate #QMS-2024-8841, valid through March 2027)
- ISO 14001:2015 (Certificate #EMS-2024-2203, valid through March 2027)
- AS9100D Rev D (Certificate #AS-2023-1556, valid through September 2026)
- IATF 16949:2016 (Certificate #IATF-2024-0092)
- Conflict Minerals Policy: Full compliance with Dodd-Frank Section 1502. CMRT available.
- HSE Program: OSHA VPP Star site. Zero lost-time incidents in past 36 months.
- All materials fully traceable. MTR provided per EN 10204 Type 3.1 for every shipment.

## PROPOSED MATERIALS & PRICING

### Material 1: Structural Steel - ASTM A36/A992
- Grade: ASTM A36 (plates), A992 (W-shapes) - FULL MATCH to requirements
- Quantity: 500 metric tons
- Origin: Nucor Steel, USA (domestic)
- Surface: Blast-cleaned to SSPC-SP6 per specification
- Unit Price: $950/ton
- Subtotal: $475,000

### Material 2: Aluminum 6061-T6 / 6063-T5
- Grade: 6061-T6 (sheet per ASTM B209), 6063-T5 (extrusions per ASTM B221) - FULL MATCH
- Quantity: 200 metric tons
- Origin: Alcoa, USA (domestic, max 15% recycled content)
- Surface: Mill finish, anodizing-ready
- Unit Price: $2,650/ton
- Subtotal: $530,000

### Material 3: Copper C11000 ETP
- Grade: C11000 UNS (per ASTM B152/B187) - FULL MATCH
- Quantity: 50 metric tons
- Origin: Freeport-McMoRan, USA (domestic)
- Conductivity: Certified minimum 101% IACS (exceeds 100% requirement)
- Unit Price: $9,200/ton
- Subtotal: $460,000

## TOTAL PROPOSED PRICE: $1,465,000 USD

## COMMERCIAL TERMS
- Payment Terms: Net 60 (accepted)
- Delivery Terms: DDP Houston, TX (Incoterms 2020)
- Validity: 60 days from proposal date

## DELIVERY SCHEDULE
- Steel (500 tons): Ship by April 20, 2026 → Arrive May 5, 2026 (10 days before deadline)
- Aluminum (200 tons): Ship by May 1, 2026 → Arrive May 18, 2026
- Copper (50 tons): Ship by May 10, 2026 → Arrive May 25, 2026
- All deliveries completed by May 25, 2026 (21 days ahead of final deadline)

## KEY STRENGTHS
1. All three materials fully match required grades and specifications
2. Complete certification suite (ISO 9001, 14001, AS9100D, IATF 16949)
3. 100% domestic US sourcing with full material traceability
4. Delivery 21 days ahead of deadline
5. Proven track record with Meridian Heavy Industries (3 successful past orders)

## KEY CONSIDERATIONS
- Our pricing reflects premium domestic sourcing and AS9100D quality standards
- Total exceeds stated budget of $850,000 but delivers superior quality assurance
- We offer a 3% early payment discount (Net 30) reducing total to $1,421,050
"""


VENDOR_BETACORP = """
## BETACORP SOLUTIONS LTD. - PROPOSAL RESPONSE
## RFQ Reference: MHI-RFQ-2026-0042

## COMPANY OVERVIEW
BetaCorp Solutions Ltd. is a global metals trading and distribution company headquartered
in Mumbai, India with regional offices in Dubai, Singapore, and Houston. Founded in 2010,
we specialize in cost-effective sourcing of industrial metals from qualified mills across
Asia, with competitive pricing for the North American market.

## CERTIFICATIONS & COMPLIANCE
- ISO 9001:2015 (Certificate #QMS-IN-2023-4420, valid through August 2026)
- ISO 14001: APPLICATION IN PROGRESS (expected certification by Q3 2026)
- Conflict Minerals: We maintain a responsible sourcing policy. CMRT available on request.
- HSE Program: Documented HSE management system per local regulations.
- MTR: Provided for all steel products. Available on request for non-ferrous metals.

## PROPOSED MATERIALS & PRICING

### Material 1: Structural Steel - ASTM A36
- Grade: ASTM A36 (plates and shapes) - MATCHES requirement
- Quantity: 500 metric tons
- Origin: JSW Steel, India + Hyundai Steel, South Korea
- Surface: Standard mill finish (SSPC-SP6 blast cleaning available at +$25/ton)
- Unit Price: $720/ton (mill finish) / $745/ton (blast-cleaned)
- Subtotal: $372,500 (blast-cleaned)

### Material 2: Aluminum 6061-T6
- Grade: 6061-T6 sheet (per ASTM B209) - PARTIAL MATCH
- Note: 6063-T5 extrusions not available. We offer 6061-T6 extrusions as substitute.
- Quantity: 200 metric tons
- Origin: Hindalco Industries, India
- Surface: Mill finish
- Recycled Content: Approximately 40-45% (Hindalco uses recycled feedstock)
- Unit Price: $2,050/ton
- Subtotal: $410,000

### Material 3: Copper C11000
- Grade: C11000 UNS (per ASTM B152) - PARTIAL MATCH
- Note: Bus bar (ASTM B187) available but from different mill. May ship separately.
- Quantity: 50 metric tons
- Origin: Hindustan Copper Limited, India
- Conductivity: Minimum 99.5% IACS (slightly below 100% requirement)
- Unit Price: $8,100/ton
- Subtotal: $405,000

## TOTAL PROPOSED PRICE: $1,187,500 USD

## COMMERCIAL TERMS
- Payment Terms: Net 45 preferred (Net 60 accepted with 2% surcharge)
- Delivery Terms: CIF Houston, TX (buyer responsible for customs clearance)
- Note: DDP available at additional $15,000 for customs brokerage and inland freight
- Validity: 45 days from proposal date

## DELIVERY SCHEDULE
- Steel (500 tons): Ship by March 25, 2026 → Arrive May 20, 2026 (maritime transit ~55 days)
- Aluminum (200 tons): Ship by April 5, 2026 → Arrive May 30, 2026
- Copper (50 tons): Ship by April 15, 2026 → Arrive June 10, 2026
- Final delivery estimated June 10, 2026 (5 days before deadline)
- Note: Maritime transit times are estimates. Delays of 1-2 weeks possible due to
  port congestion or customs clearance.

## KEY STRENGTHS
1. Most competitive pricing - significant savings vs. domestic sourcing
2. Large-scale sourcing capability from established Asian mills
3. ISO 9001 certified quality management system
4. Flexible order quantities and packaging options
5. Dedicated Houston office for local coordination

## KEY CONSIDERATIONS
- ISO 14001 certification is in progress but not yet obtained
- Some materials sourced from non-NATO countries (India, South Korea)
- Aluminum recycled content (40-45%) exceeds the 30% maximum stated in requirements
- Copper conductivity at 99.5% IACS (requirement is 100% minimum)
- Delivery terms are CIF not DDP as requested (additional cost for DDP)
- Maritime transit introduces delivery timeline risk
"""


VENDOR_GAMMAMFG = """
## GAMMAMFG CORPORATION - PROPOSAL RESPONSE
## RFQ Reference: MHI-RFQ-2026-0042

## COMPANY OVERVIEW
GammaMfg Corporation is a vertically integrated metals manufacturer and distributor
headquartered in Birmingham, Alabama. Established in 2005, we operate our own rolling
mill, extrusion facility, and copper fabrication shop. We serve the energy, infrastructure,
and industrial markets across the Southeastern United States with a focus on competitive
pricing and reliable domestic supply.

## CERTIFICATIONS & COMPLIANCE
- ISO 9001:2015 (Certificate #QMS-US-2024-6617, valid through November 2027)
- ISO 14001:2015 (Certificate #EMS-US-2024-3301, valid through November 2027)
- Conflict Minerals Policy: Full compliance with Dodd-Frank Section 1502. 
  Signed declaration and CMRT provided with this proposal (Attachment A).
- HSE Program: Comprehensive HSE system. 2 million man-hours without lost-time incident.
  OSHA inspection rating: Satisfactory (2025).
- MTR: All materials supplied with EN 10204 Type 3.1 Mill Test Reports as standard.
- Material Traceability: Full digital traceability from melt/cast to delivery.

## PROPOSED MATERIALS & PRICING

### Material 1: Structural Steel - ASTM A36/A992
- Grade: ASTM A36 (plates), A992 (W-shapes) - FULL MATCH to requirements
- Quantity: 500 metric tons
- Origin: GammaMfg rolling mill, Birmingham, AL (100% domestic)
- Surface: Blast-cleaned to SSPC-SP6 Commercial Blast (included in price)
- Unit Price: $870/ton
- Subtotal: $435,000

### Material 2: Aluminum 6061-T6 / 6063-T5
- Grade: 6061-T6 sheet (ASTM B209), 6063-T5 extrusions (ASTM B221) - FULL MATCH
- Quantity: 200 metric tons
- Origin: GammaMfg extrusion facility, Birmingham, AL (domestic)
- Recycled Content: 22% (within 30% maximum requirement)
- Surface: Mill finish, certified suitable for anodizing
- Unit Price: $2,380/ton
- Subtotal: $476,000

### Material 3: Copper C11000 ETP
- Grade: C11000 UNS per ASTM B152 (sheet/plate) and ASTM B187 (bus bar) - FULL MATCH
- Quantity: 50 metric tons
- Origin: GammaMfg copper fabrication shop using Aurubis AG feedstock (Germany - NATO ally)
- Conductivity: Certified minimum 100.2% IACS (meets 100% requirement)
- Unit Price: $8,900/ton
- Subtotal: $445,000

## TOTAL PROPOSED PRICE: $1,356,000 USD

## COMMERCIAL TERMS
- Payment Terms: Net 60 (accepted as specified)
- Delivery Terms: DDP Houston, TX (Incoterms 2020) - as requested
- Validity: 90 days from proposal date
- Volume Discount: 5% discount available if all three materials awarded to GammaMfg
  → Discounted Total: $1,288,200 USD

## DELIVERY SCHEDULE
- Steel (500 tons): Production start March 1 → Deliver by May 10, 2026 (5 days early)
- Aluminum (200 tons): Production start March 15 → Deliver by May 25, 2026
- Copper (50 tons): Production start April 1 → Deliver by June 1, 2026
- All deliveries completed by June 1, 2026 (14 days ahead of final deadline)
- Note: GammaMfg facility is 650 miles from Houston - 1-day truck transit.
  No maritime shipping risk.

## KEY STRENGTHS
1. All three materials fully match required grades and specifications
2. ISO 9001 and ISO 14001 certified (both current)
3. 100% domestic manufacturing with full traceability
4. Vertically integrated - we manufacture what we sell (no middleman risk)
5. 5% volume discount for full award reduces total to $1,288,200
6. Proven track record with MHI - supplied Lake Charles Power Plant (2024)
7. Short supply chain (Birmingham to Houston = 1-day transit)

## KEY CONSIDERATIONS
- Total price exceeds stated budget of $850,000
- We do not hold AS9100D certification (noted as preference, not mandatory)
- Volume discount of 5% available to improve commercial position
- We can discuss value engineering options to reduce cost if needed

## REFERENCES
1. Meridian Heavy Industries - Lake Charles Power Plant (2024) - Contact: J. Williams
2. ExxonMobil - Beaumont Refinery Turnaround (2023) - Contact: R. Patel
3. Entergy Corp - Grand Gulf Nuclear Station Maintenance (2024) - Contact: M. Chen
"""


def main():
    print("=" * 60)
    print("  Generating Realistic Test Data PDFs")
    print("=" * 60)

    # Company documents
    create_pdf("Company_Requirements.pdf",
               "MERIDIAN HEAVY INDUSTRIES - REQUEST FOR QUOTATION",
               COMPANY_REQUIREMENTS)

    create_pdf("Company_Knowledge_Base.pdf",
               "MERIDIAN HEAVY INDUSTRIES - CORPORATE KNOWLEDGE BASE",
               COMPANY_KNOWLEDGE_BASE)

    # Vendor proposals
    create_pdf("vendor_proposals/Vendor_AlphaTech.pdf",
               "ALPHATECH INDUSTRIES - VENDOR PROPOSAL",
               VENDOR_ALPHATECH)

    create_pdf("vendor_proposals/Vendor_BetaCorp.pdf",
               "BETACORP SOLUTIONS LTD. - VENDOR PROPOSAL",
               VENDOR_BETACORP)

    create_pdf("vendor_proposals/Vendor_GammaMfg.pdf",
               "GAMMAMFG CORPORATION - VENDOR PROPOSAL",
               VENDOR_GAMMAMFG)

    print("\n" + "=" * 60)
    print("  All PDFs generated successfully!")
    print("=" * 60)

    print("\n  Vendor Design Summary:")
    print("  ┌─────────────────────┬──────────────┬─────────┬─────────────┐")
    print("  │ Vendor              │ Price        │ Certs   │ Profile     │")
    print("  ├─────────────────────┼──────────────┼─────────┼─────────────┤")
    print("  │ AlphaTech ($1.465M) │ Over budget  │ ALL ✓   │ Premium     │")
    print("  │ BetaCorp  ($1.188M) │ Over budget  │ Gaps ✗  │ Budget      │")
    print("  │ GammaMfg  ($1.356M) │ Over budget  │ Good ✓  │ Balanced    │")
    print("  └─────────────────────┴──────────────┴─────────┴─────────────┘")
    print("\n  Note: All vendors are over the $850K budget (realistic for")
    print("  industrial procurement). Scores will differentiate on quality,")
    print("  compliance, and relative pricing competitiveness.")


if __name__ == "__main__":
    main()
