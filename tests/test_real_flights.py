
import json
from pathlib import Path


FIXTURE_PATH = (
    Path(__file__).parent
    / "fixtures"
    / "flight_search_sample.json"
)


def load_flight_data():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def test_flight_response_structure():
    data = load_flight_data()

    assert data["status"] == "success"
    assert data["source"] == "serpapi_google_flights"
    assert data["origin"] == "DEL"
    assert data["destination"] == "GOI"
    assert data["passengers"] == 1

    assert len(data["outbound"]["flights"]) > 0
    assert len(data["return"]["flights"]) > 0


def test_flight_prices_are_valid():
    data = load_flight_data()

    flights = (
        data["outbound"]["flights"]
        + data["return"]["flights"]
    )

    for flight in flights:
        assert flight["price"] > 0
        assert flight["currency"] == "INR"
        assert flight["duration_minutes"] > 0
        assert flight["stops"] >= 0


def test_cheapest_round_trip():
    data = load_flight_data()

    outbound = data["outbound"]["flights"]
    returning = data["return"]["flights"]

    cheapest_outbound = min(
        outbound,
        key=lambda flight: flight["price"]
    )

    cheapest_return = min(
        returning,
        key=lambda flight: flight["price"]
    )

    total = (
        cheapest_outbound["price"]
        + cheapest_return["price"]
    )

    assert cheapest_outbound["airline"] == "Air India Express"
    assert cheapest_return["airline"] == "IndiGo"
    assert total == 18935
