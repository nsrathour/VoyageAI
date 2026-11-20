
import os
from datetime import date

from dotenv import load_dotenv
from langchain.tools import tool

from app.tools.flight_tools import search_flights
from app.tools.serpapi_flights import search_real_flights
from app.tools.train_tools import search_trains
from app.tools.hotel_tools import search_hotels
from app.tools.restaurant_tools import search_restaurants
from app.tools.serpapi_hotels import search_real_hotels
from app.tools.serpapi_restaurants import search_real_restaurants
from app.tools.railcore_trains import search_real_trains

load_dotenv()


@tool
def flight_search_tool(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    passengers: int = 1
):
    """
    Search round-trip flights.

    Mock provider accepts supported city names.
    SerpApi provider requires IATA airport codes,
    for example DEL and GOI.

    Returns flight options and reported prices.
    """

    provider = os.getenv(
        "FLIGHT_PROVIDER", "mock"
    ).strip().lower()

    if provider == "mock":
        return search_flights(
            origin,
            destination,
            departure_date,
            return_date,
            passengers
        )

    if provider == "serpapi":

        # Validate dates before making paid/quota-limited requests.
        departure = date.fromisoformat(departure_date)
        returning = date.fromisoformat(return_date)

        if returning < departure:
            raise ValueError(
                "Return date cannot be before departure date."
            )

        if passengers < 1:
            raise ValueError(
                "Passengers must be at least 1."
            )

        for airport in (origin, destination):
            if not (
                len(airport) == 3
                and airport.isascii()
                and airport.isalpha()
            ):
                raise ValueError(
                    "SerpApi requires 3-letter IATA airport codes, "
                    "such as DEL and GOI."
                )

        # Outbound flight search
        outbound = search_real_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            passengers=passengers
        )

        # Return flight search
        inbound = search_real_flights(
            origin=destination,
            destination=origin,
            departure_date=return_date,
            passengers=passengers
        )

        status = (
            "success"
            if (
                outbound["status"] == "success"
                and inbound["status"] == "success"
            )
            else "unavailable"
        )

        return {
            "status": status,
            "source": "serpapi_google_flights",
            "provider": "serpapi",
            "origin": origin.upper(),
            "destination": destination.upper(),
            "departure_date": departure_date,
            "return_date": return_date,
            "passengers": passengers,
            "outbound": outbound,
            "return": inbound,
            "pricing_note": (
                "Prices are reported by the flight search API. "
                "Do not assume per-passenger or group-total pricing "
                "without verifying the provider's fare semantics. "
                "These are separate one-way searches, not a "
                "confirmed round-trip booking quote."
            )
        }

    raise ValueError(
        f"Unsupported flight provider: {provider}"
    )



@tool
def train_search_tool(
    origin: str,
    destination: str,
    departure_date: str,
    passengers: int = 1
):
    """
    Search trains using mock or RailCore.

    RailCore requires Indian railway station codes,
    e.g. BSL and ADI.
    """

    provider = os.getenv(
        "TRAIN_PROVIDER", "mock"
    ).strip().lower()

    if provider == "mock":
        return search_trains(
            origin,
            destination,
            departure_date,
            passengers
        )

    if provider == "railcore":
        if passengers < 1:
            raise ValueError(
                "Passengers must be at least 1."
            )

        result = search_real_trains(
            origin=origin,
            destination=destination,
            departure_date=departure_date
        )

        return {
            **result,
            "passengers": passengers,
            "pricing_note": (
                "RailCore results currently contain train schedules "
                "and travel classes, not verified ticket fares "
                "or seat availability. Do not invent prices."
            )
        }

    raise ValueError(
        f"Unsupported train provider: {provider}"
    )


@tool
def hotel_search_tool(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1
):
    """
    Search hotels using the configured provider:
    mock or SerpApi Google Hotels.
    """

    provider = os.getenv(
        "HOTEL_PROVIDER", "mock"
    ).strip().lower()

    if provider == "mock":
        return search_hotels(
            destination,
            check_in,
            check_out,
            guests
        )

    if provider == "serpapi":
        return search_real_hotels(
            destination=destination,
            check_in=check_in,
            check_out=check_out,
            guests=guests
        )

    raise ValueError(
        f"Unsupported hotel provider: {provider}"
    )


@tool
def restaurant_search_tool(
    location: str,
    min_rating: float = 4.0
):
    """
    Search restaurants using the configured provider:
    mock or SerpApi Google Maps.
    """

    provider = os.getenv(
        "RESTAURANT_PROVIDER", "mock"
    ).strip().lower()

    if provider == "mock":
        return search_restaurants(
            location,
            min_rating
        )

    if provider == "serpapi":
        return search_real_restaurants(
            location=location,
            min_rating=min_rating
        )

    raise ValueError(
        f"Unsupported restaurant provider: {provider}"
    )


travel_tools = [
    flight_search_tool,
    train_search_tool,
    hotel_search_tool,
    restaurant_search_tool
]
