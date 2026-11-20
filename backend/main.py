
from app.tools.langchain_tools import (
    train_search_tool,
    hotel_search_tool,
    restaurant_search_tool
)


def main():
    print("\n--- TRAIN SEARCH ---")
    print(train_search_tool.invoke({
        "origin": "Delhi",
        "destination": "Goa",
        "departure_date": "2026-12-11",
        "passengers": 2
    }))

    print("\n--- HOTEL SEARCH ---")
    print(hotel_search_tool.invoke({
        "destination": "Goa",
        "check_in": "2026-12-11",
        "check_out": "2026-12-16",
        "guests": 2
    }))

    print("\n--- RESTAURANT SEARCH ---")
    print(restaurant_search_tool.invoke({
        "location": "Near Calangute Beach, Goa",
        "min_rating": 4.0
    }))


if __name__ == "__main__":
    main()
