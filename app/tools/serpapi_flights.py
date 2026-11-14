
import os
from datetime import date

import httpx
from dotenv import load_dotenv

load_dotenv()

SERPAPI_URL = "https://serpapi.com/search.json"


def parse_flight_results(data: dict) -> list[dict]:
    """
    Convert SerpApi Google Flights response
    into VoyageAI's flight format.
    """
    flight_options = (
        data.get("best_flights", [])
        + data.get("other_flights", [])
    )

    flights = []

    for option in flight_options[:5]:
        segments = option.get("flights", [])

        if not segments:
            continue

        first_segment = segments[0]
        last_segment = segments[-1]

        flights.append({
            "airline": ", ".join(
                dict.fromkeys(
                    segment.get("airline", "Unknown")
                    for segment in segments
                )
            ),
            "departure_time": first_segment.get(
                "departure_airport", {}
            ).get("time"),
            "arrival_time": last_segment.get(
                "arrival_airport", {}
            ).get("time"),
            "duration_minutes": option.get("total_duration"),
            "stops": max(0, len(segments) - 1),
            "price": option.get("price"),
            "currency": "INR"
        })

    return flights


def search_real_flights(
    origin: str,
    destination: str,
    departure_date: str,
    passengers: int = 1
):
    """
    Search one-way flights using SerpApi Google Flights.

    origin and destination must be IATA airport codes.
    Example: DEL -> GOI
    """

    api_key = os.getenv("SERPAPI_API_KEY")

    if not api_key:
        raise ValueError("SERPAPI_API_KEY is not configured.")

    date.fromisoformat(departure_date)

    if passengers < 1:
        raise ValueError("Passengers must be at least 1.")

    params = {
        "engine": "google_flights",
        "api_key": api_key,
        "departure_id": origin.upper(),
        "arrival_id": destination.upper(),
        "outbound_date": departure_date,
        "type": "2",
        "adults": passengers,
        "currency": "INR",
        "gl": "in",
        "hl": "en"
    }

    with httpx.Client(timeout=45.0) as client:
        response = client.get(SERPAPI_URL, params=params)
        response.raise_for_status()
        data = response.json()

    if "error" in data:
        raise ValueError(f"Flight API error: {data['error']}")

    flight_options = (
        data.get("best_flights", [])
        + data.get("other_flights", [])
    )

    flights = []

    for option in flight_options[:5]:
        segments = option.get("flights", [])

        if not segments:
            continue

        first_segment = segments[0]
        last_segment = segments[-1]

        flights.append({
            "airline": ", ".join(
                dict.fromkeys(
                    segment.get("airline", "Unknown")
                    for segment in segments
                )
            ),
            "departure_time": first_segment.get(
                "departure_airport", {}
            ).get("time"),
            "arrival_time": last_segment.get(
                "arrival_airport", {}
            ).get("time"),
            "duration_minutes": option.get("total_duration"),
            "stops": max(0, len(segments) - 1),
            "price": option.get("price"),
            "currency": "INR"
        })

    return {
        "status": "success" if flights else "unavailable",
        "source": "serpapi_google_flights",
        "origin": origin.upper(),
        "destination": destination.upper(),
        "departure_date": departure_date,
        "passengers": passengers,
        "flights": flights
    }


if __name__ == "__main__":
    result = search_real_flights(
        origin="DEL",
        destination="GOI",
        departure_date="2026-12-11",
        passengers=1
    )

    print("Status:", result["status"])
    print("Source:", result["source"])

    for flight in result["flights"]:
        print(flight)
