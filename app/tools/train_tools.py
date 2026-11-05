
from datetime import date

from app.models.schemas import TrainOption


def search_trains(
    origin: str,
    destination: str,
    departure_date: str,
    passengers: int = 1
):
    """
    Search mock trains between two destinations.
    """

    # Validate departure date
    departure = date.fromisoformat(departure_date)

    if passengers < 1:
        raise ValueError("Passengers must be at least 1")

    # Mock train data
    trains = [
        TrainOption(
            train_name="Rajdhani Express",
            departure_time="16:00",
            arrival_time="08:00",
            duration="16h",
            price_per_passenger=2200,
            total_price=2200 * passengers
        ),
        TrainOption(
            train_name="Duronto Express",
            departure_time="19:30",
            arrival_time="11:30",
            duration="16h",
            price_per_passenger=1900,
            total_price=1900 * passengers
        ),
        TrainOption(
            train_name="Superfast Express",
            departure_time="21:00",
            arrival_time="15:00",
            duration="18h",
            price_per_passenger=1500,
            total_price=1500 * passengers
        )
    ]

    return {
        "status": "success",
        "source": "mock",
        "origin": origin,
        "destination": destination,
        "departure_date": departure_date,
        "passengers": passengers,
        "trains": [
            train.model_dump()
            for train in trains
        ]
    }
