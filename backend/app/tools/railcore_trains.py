
import os
from datetime import date

import httpx
from dotenv import load_dotenv

load_dotenv()

RAILCORE_URL = "https://ir.railcore.tech/v1/routes/trains"


def search_real_trains(
    origin: str,
    destination: str,
    departure_date: str
):
    """
    Search trains between two Indian railway stations.

    origin and destination must be station codes.
    Example: BSL -> ADI
    """

    api_key = os.getenv("RAILCORE_API_KEY")

    if not api_key:
        raise ValueError("RAILCORE_API_KEY is missing.")

    if not origin.strip() or not destination.strip():
        raise ValueError("Station codes cannot be empty.")

    date.fromisoformat(departure_date)

    params = {
        "from": origin.strip().upper(),
        "to": destination.strip().upper(),
        "date": departure_date,
        "quota": "GN",
        "match": "city"
    }

    headers = {
        "X-RailCore-Key": api_key
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.get(
            RAILCORE_URL,
            params=params,
            headers=headers
        )
        response.raise_for_status()
        data = response.json()

    if not data.get("success"):
        error = data.get("error") or {}
        raise ValueError(
            f"RailCore error: {error.get('code', 'UNKNOWN')}"
        )

    train_results = data.get("data", {}).get("trains", [])

    trains = []

    for train in train_results[:10]:
        trains.append({
            "train_number": train.get("train_number"),
            "train_name": train.get("train_name"),
            "departure_time": train.get("departure_time"),
            "arrival_time": train.get("arrival_time"),
            "duration_minutes": train.get("duration_minutes"),
            "classes": train.get("classes", []),
            "running_days": train.get("running_days", [])
        })

    return {
        "status": "success" if trains else "no_results",
        "source": "railcore",
        "origin": origin.upper(),
        "destination": destination.upper(),
        "departure_date": departure_date,
        "trains": trains
    }


if __name__ == "__main__":
    result = search_real_trains(
        origin="BSL",
        destination="ADI",
        departure_date="2026-11-21"
    )

    print("Status:", result["status"])
    print("Source:", result["source"])
    print("Trains found:", len(result["trains"]))

    for train in result["trains"]:
        print(train)
