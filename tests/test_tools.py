import pytest

from app.tools.flight_tools import search_flights
from app.tools.train_tools import search_trains
from app.tools.hotel_tools import search_hotels
from app.tools.restaurant_tools import search_restaurants


# -------------------------
# Flight Tool Tests
# -------------------------

def test_search_flights_success():
    result = search_flights(
        "Delhi", "Goa",
        "2026-12-11", "2026-12-16", 2
    )

    assert result["status"] == "success"
    assert result["source"] == "mock"

    # Check outbound flights
    assert len(result["outbound"]["flights"]) == 3

    # Check return flights
    assert len(result["return"]["flights"]) == 3

    # Check route information
    assert result["outbound"]["origin"] == "Delhi"
    assert result["outbound"]["destination"] == "Goa"

    assert result["return"]["origin"] == "Goa"
    assert result["return"]["destination"] == "Delhi"

    # Check passenger count
    assert result["passengers"] == 2


def test_search_flights_invalid_return_date():
    with pytest.raises(ValueError):
        search_flights(
            "Delhi", "Goa",
            "2026-12-15", "2026-12-10", 1
        )


# -------------------------
# Train Tool Tests
# -------------------------

def test_search_trains_success():
    result = search_trains(
        "Delhi", "Goa", "2026-12-11", 2
    )

    assert result["status"] == "success"
    assert len(result["trains"]) == 3


def test_search_trains_invalid_passengers():
    with pytest.raises(ValueError):
        search_trains(
            "Delhi", "Goa", "2026-12-11", 0
        )


# -------------------------
# Hotel Tool Tests
# -------------------------

def test_search_hotels_success():
    result = search_hotels(
        "Goa", "2026-12-11", "2026-12-16", 2
    )

    assert result["status"] == "success"
    assert len(result["hotels"]) == 3


def test_search_hotels_unavailable():
    result = search_hotels(
        "Goa", "2026-12-10", "2026-12-15", 2
    )

    assert result["status"] == "unavailable"
    assert len(result["hotels"]) == 0


def test_search_hotels_invalid_dates():
    with pytest.raises(ValueError):
        search_hotels(
            "Goa", "2026-12-15", "2026-12-10", 2
        )


# -------------------------
# Restaurant Tool Tests
# -------------------------

def test_search_restaurants_success():
    result = search_restaurants(
        "Near Calangute Beach, Goa", 4.0
    )

    assert result["status"] == "success"
    assert len(result["restaurants"]) == 3


def test_search_restaurants_rating_filter():
    result = search_restaurants(
        "Near Calangute Beach, Goa", 4.5
    )

    assert len(result["restaurants"]) == 1
    assert result["restaurants"][0]["rating"] >= 4.5


def test_search_restaurants_invalid_rating():
    with pytest.raises(ValueError):
        search_restaurants(
            "Near Calangute Beach, Goa", 6.0
        )
