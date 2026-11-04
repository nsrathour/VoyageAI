
from langchain.tools import tool

from app.tools.flight_tools import search_flights
from app.tools.train_tools import search_trains
from app.tools.hotel_tools import search_hotels
from app.tools.restaurant_tools import search_restaurants


@tool
def flight_search_tool(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: str,
    passengers: int = 1
):
    """Search available flights between an origin and destination."""

    return search_flights(
        origin, destination,
        departure_date, return_date, passengers
    )


@tool
def train_search_tool(
    origin: str,
    destination: str,
    departure_date: str,
    passengers: int = 1
):
    """Search available trains between an origin and destination."""

    return search_trains(
        origin, destination, departure_date, passengers
    )


@tool
def hotel_search_tool(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1
):
    """Search available hotels at a destination for selected dates."""

    return search_hotels(
        destination, check_in, check_out, guests
    )


@tool
def restaurant_search_tool(
    location: str,
    min_rating: float = 4.0
):
    """Search nearby restaurants filtered by minimum rating."""

    return search_restaurants(location, min_rating)


travel_tools = [
    flight_search_tool,
    train_search_tool,
    hotel_search_tool,
    restaurant_search_tool
]
