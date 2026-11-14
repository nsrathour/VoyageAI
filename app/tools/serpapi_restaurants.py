
import os

import httpx
from dotenv import load_dotenv

load_dotenv()

SERPAPI_URL = "https://serpapi.com/search.json"


def search_real_restaurants(
    location: str,
    min_rating: float = 4.0
):
    """
    Search restaurants using SerpApi Google Maps.
    """

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise ValueError("SERPAPI_API_KEY is missing.")

    if not location.strip():
        raise ValueError("Location cannot be empty.")

    if not 0 <= min_rating <= 5:
        raise ValueError("Rating must be between 0 and 5.")

    params = {
        "engine": "google_maps",
        "type": "search",
        "q": f"restaurants near {location}",
        "api_key": api_key,
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

    restaurants = []

    for place in data.get("local_results", []):
        rating = place.get("rating")

        if rating is None or rating < min_rating:
            continue

        restaurants.append({
            "restaurant_name": place.get("title"),
            "cuisine": place.get("type"),
            "rating": rating,
            "reviews": place.get("reviews"),
            "address": place.get("address"),
            "price_range": place.get("price"),
            "coordinates": place.get("gps_coordinates"),
            "place_id": place.get("place_id"),
            "source": "serpapi_google_maps"
        })

    restaurants.sort(
        key=lambda restaurant: restaurant["rating"],
        reverse=True
    )

    return {
        "status": "success" if restaurants else "no_results",
        "source": "serpapi_google_maps",
        "location": location,
        "min_rating": min_rating,
        "restaurants": restaurants[:5]
    }


if __name__ == "__main__":
    result = search_real_restaurants(
        location="Calangute Beach, Goa, India",
        min_rating=4.0
    )

    print("Status:", result["status"])
    print("Source:", result["source"])
    print("Restaurants found:", len(result["restaurants"]))

    for restaurant in result["restaurants"]:
        print(restaurant)
