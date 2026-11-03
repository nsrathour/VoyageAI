
from app.models.schemas import RestaurantOption


def search_restaurants(
    location: str,
    min_rating: float = 4.0
):
    """
    Search nearby restaurants based on hotel location.

    Currently uses mock data.
    """

    if not 0 <= min_rating <= 5:
        raise ValueError("Rating must be between 0 and 5")

    restaurants = [
        RestaurantOption(
            restaurant_name="Fisherman's Wharf",
            cuisine="Seafood",
            rating=4.5,
            distance_km=1.2,
            average_price=800
        ),
        RestaurantOption(
            restaurant_name="Thalassa",
            cuisine="Greek",
            rating=4.4,
            distance_km=2.5,
            average_price=1200
        ),
        RestaurantOption(
            restaurant_name="Vinayak Family Restaurant",
            cuisine="Goan",
            rating=4.2,
            distance_km=0.8,
            average_price=500
        ),
        RestaurantOption(
            restaurant_name="Local Cafe",
            cuisine="Cafe",
            rating=3.8,
            distance_km=0.5,
            average_price=350
        )
    ]

    # Filter restaurants based on minimum rating
    filtered_restaurants = [
        restaurant
        for restaurant in restaurants
        if restaurant.rating >= min_rating
    ]

    return {
        "status": "success",
        "source": "mock",
        "location": location,
        "minimum_rating": min_rating,
        "restaurants": [
            restaurant.model_dump()
            for restaurant in filtered_restaurants
        ]
    }
