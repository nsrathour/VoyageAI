
from datetime import date

from app.models.schemas import FlightOption


def search_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    passengers: int = 1
):
    """
    Search available flights between two destinations.

    This is currently a mock implementation.
    """

    # Validate dates
    departure = date.fromisoformat(departure_date)
    returning = date.fromisoformat(return_date)

    if returning < departure:
        raise ValueError("Return date cannot be before departure date")

    if passengers < 1:
        raise ValueError("Passengers must be at least 1")

    # Mock flight data
    flights = [
        FlightOption(
            airline="IndiGo",
            departure_time="06:30",
            arrival_time="09:00",
            duration="2h 30m",
            price_inr=5500 * passengers
        ),
        FlightOption(
            airline="Air India",
            departure_time="11:00",
            arrival_time="13:45",
            duration="2h 45m",
            price_inr=6800 * passengers
        ),
        FlightOption(
            airline="Akasa Air",
            departure_time="17:30",
            arrival_time="20:00",
            duration="2h 30m",
            price_inr=6100 * passengers
        )
    ]

    return {
        "status": "success",
        "source": "mock",
        "origin": origin,
        "destination": destination,
        "departure_date": departure_date,
        "return_date": return_date,
        "flights": [
            flight.model_dump() for flight in flights
        ]
    }
