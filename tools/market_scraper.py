"""
Market Scraper Tool: Fetches live/simulated commodity prices.
Used by the Scorer to validate whether vendor-quoted prices are reasonable.
"""
import random


# Mock market database (in production, this would scrape real commodity exchanges)
MARKET_PRICES_USD_PER_TON = {
    "steel": 850.00,
    "aluminum": 2400.00,
    "copper": 8900.00,
    "silicon": 1900.00,
    "titanium": 4500.00,
    "cobalt": 33000.00,
    "nickel": 16000.00,
    "zinc": 2700.00,
}


def fetch_commodity_price(commodity: str) -> dict:
    """
    Fetches the current market price for a commodity.
    Introduces +/-5% volatility to simulate real-time pricing.
    """
    base_price = MARKET_PRICES_USD_PER_TON.get(commodity.lower())
    if base_price is None:
        return {"error": f"Commodity '{commodity}' not found in market index."}

    fluctuation = random.uniform(-0.05, 0.05)
    live_price = base_price * (1 + fluctuation)

    return {
        "commodity": commodity,
        "live_price_usd": round(live_price, 2), # type: ignore
        "currency": "USD",
        "unit": "Metric Ton",
        "market_trend": "up" if fluctuation > 0 else "down",
    }


def validate_vendor_prices(offered_materials: list) -> list:
    """
    Cross-checks each vendor-offered material price against market rates.
    Returns a list of dicts with market comparison for each material.
    """
    comparisons = []
    for mat in offered_materials:
        material_name = mat.get("material", "")
        vendor_price = mat.get("unit_price_usd", 0) or 0

        market_info = fetch_commodity_price(material_name)

        if "error" in market_info:
            comparisons.append({
                "material": material_name,
                "vendor_price": vendor_price,
                "market_price": None,
                "markup_pct": None,
                "verdict": "No market data available",
            })
        else:
            market_price = market_info["live_price_usd"]
            if market_price > 0:
                markup_pct = round((vendor_price - market_price) / market_price * 100, 1) # type: ignore
            else:
                markup_pct = 0

            if markup_pct > 15:
                verdict = "OVERPRICED"
            elif markup_pct > 5:
                verdict = "Above market"
            elif markup_pct < -5:
                verdict = "Below market (good deal)"
            else:
                verdict = "Fair market price"

            comparisons.append({
                "material": material_name,
                "vendor_price": vendor_price,
                "market_price": market_price,
                "markup_pct": markup_pct,
                "verdict": verdict,
            })

    return comparisons


if __name__ == "__main__":
    test_materials = [
        {"material": "Steel", "unit_price_usd": 920},
        {"material": "Aluminum", "unit_price_usd": 2200},
        {"material": "Copper", "unit_price_usd": 9200},
    ]
    results = validate_vendor_prices(test_materials)
    for r in results:
        print(f"{r['material']}: Vendor ${r['vendor_price']} vs Market ${r['market_price']} "
              f"({r['markup_pct']:+.1f}%) -> {r['verdict']}")
