
import os
from datetime import date

import httpx
from dotenv import load_dotenv

load_dotenv()

SERPAPI_URL = "https://serpapi.com/search.json"

def search_real_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1
):
    """
    Search hotels using SerpApi Google Hotels.
    """

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise ValueError("SERPAPI_API_KEY is missing.")

    start = date.fromisoformat(check_in)
    end = date.fromisoformat(check_out)

    if end <= start:
        raise ValueError(
            "Check-out must be after check-in."
        )

    if guests < 1:
        raise ValueError(
            "Guests must be at least 1."
        )

    params = {
        "engine": "google_hotels",
        "api_key": api_key,
        "q": f"Hotels in {destination}",
        "check_in_date": check_in,
        "check_out_date": check_out,
        "adults": guests,
        "currency": "INR",
        "gl": "in",
        "hl": "en"
    }

    with httpx.Client(timeout=45.0) as client:
        response = client.get(
            SERPAPI_URL,
            params=params
        )
        response.raise_for_status()
        data = response.json()

    if "error" in data:
        raise ValueError(data["error"])

    hotels = []

    for property_data in data.get("properties", [])[:5]:
        hotels.append({
            "hotel_name": property_data.get("name"),
            "rating": property_data.get("overall_rating"),
            "price_per_night": property_data.get(
                "rate_per_night", {}
            ).get("extracted_lowest"),
            "total_price": property_data.get(
                "total_rate", {}
            ).get("extracted_lowest"),
            "location": destination,
            "currency": "INR"
        })

    return {
        "status": "success" if hotels else "unavailable",
        "source": "serpapi_google_hotels",
        "destination": destination,
        "check_in": check_in,
        "check_out": check_out,
        "guests": guests,
        "hotels": hotels
    }

if __name__ == "__main__":
    result = search_real_hotels(
        destination="Goa",
        check_in="2026-12-11",
        check_out="2026-12-16",
        guests=2
    )

    print("Status:", result["status"])
    print("Hotels found:", len(result["hotels"]))

    for hotel in result["hotels"]:
        print(hotel)