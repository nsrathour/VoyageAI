
from datetime import date
from pydantic import BaseModel, Field


class TravelRequest(BaseModel):
    origin: str
    destination: str
    departure_date: date
    return_date: date
    passengers: int = Field(default=1, ge=1)
    budget: float = Field(gt=0)


class FlightOption(BaseModel):
    airline: str
    departure_time: str
    arrival_time: str
    duration: str
    price_inr: float


class TrainOption(BaseModel):
    train_name: str
    departure_time: str
    arrival_time: str
    duration: str
    price_inr: float


class HotelOption(BaseModel):
    hotel_name: str
    location: str
    rating: float
    price_per_night: float


class RestaurantOption(BaseModel):
    restaurant_name: str
    cuisine: str
    rating: float
    distance_km: float
    average_price: float
