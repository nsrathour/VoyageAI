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
    Search mock round-trip flights between two destinations.
    """

    departure = date.fromisoformat(departure_date)
    returning = date.fromisoformat(return_date)

    if returning < departure:
        raise ValueError("Return date cannot be before departure date")

    if passengers < 1:
        raise ValueError("Passengers must be at least 1")

    # Outbound flight data
    outbound_flights = [
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

    # Return flight data
    return_flights = [
        FlightOption(
            airline="IndiGo",
            departure_time="08:00",
            arrival_time="10:30",
            duration="2h 30m",
            price_inr=5800 * passengers
        ),
        FlightOption(
            airline="Air India",
            departure_time="14:00",
            arrival_time="16:45",
            duration="2h 45m",
            price_inr=6500 * passengers
        ),
        FlightOption(
            airline="Akasa Air",
            departure_time="19:00",
            arrival_time="21:30",
            duration="2h 30m",
            price_inr=6200 * passengers
        )
    ]

    return {
        "status": "success",
        "source": "mock",

        "outbound": {
            "origin": origin,
            "destination": destination,
            "date": departure_date,
            "flights": [
                flight.model_dump()
                for flight in outbound_flights
            ]
        },

        "return": {
            "origin": destination,
            "destination": origin,
            "date": return_date,
            "flights": [
                flight.model_dump()
                for flight in return_flights
            ]
        },

        "passengers": passengers
    }