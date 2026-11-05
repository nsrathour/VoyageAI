
from datetime import date

from app.models.schemas import HotelOption


def search_hotels(
    destination: str,
    check_in: str,
    check_out: str,
    guests: int = 1
):
    """
    Search mock hotels at a destination.
    """

    # Validate dates
    check_in_date = date.fromisoformat(check_in)
    check_out_date = date.fromisoformat(check_out)

    if check_out_date <= check_in_date:
        raise ValueError("Check-out must be after check-in")

    if guests < 1:
        raise ValueError("Guests must be at least 1")

    # Calculate number of nights
    nights = (check_out_date - check_in_date).days

    # Simulate hotel unavailability
    if check_in == "2026-12-10":
        return {
            "status": "unavailable",
            "source": "mock",
            "message": "No hotels available for the selected dates.",
            "destination": destination,
            "check_in": check_in,
            "check_out": check_out,
            "number_of_nights": nights,
            "guests": guests,
            "hotels": []
        }

    # Mock hotel data
    hotels = [
        HotelOption(
            hotel_name="Grand Palace Hotel",
            location=f"Near Calangute Beach, {destination}",
            rating=4.5,
            price_per_night=3500,
            total_price=3500 * nights
        ),
        HotelOption(
            hotel_name="Ocean View Resort",
            location=f"Near Baga Beach, {destination}",
            rating=4.3,
            price_per_night=4200,
            total_price=4200 * nights
        ),
        HotelOption(
            hotel_name="Budget Stay Inn",
            location=f"Near Panjim, {destination}",
            rating=4.0,
            price_per_night=1800,
            total_price=1800 * nights
        )
    ]

    return {
        "status": "success",
        "source": "mock",
        "destination": destination,
        "check_in": check_in,
        "check_out": check_out,
        "number_of_nights": nights,
        "guests": guests,
        "hotels": [
            hotel.model_dump()
            for hotel in hotels
        ]
    }
