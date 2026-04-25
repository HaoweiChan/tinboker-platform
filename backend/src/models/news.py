"""
News and events-related Pydantic models
"""
from pydantic import BaseModel, Field
from typing import Optional, Literal


EventType = Literal["earnings", "conference", "news", "dividend"]


class StockEvent(BaseModel):
    """Stock-related event (earnings, news, etc.)"""
    id: str = Field(..., description="Unique event identifier")
    type: EventType = Field(..., description="Event type")
    date: int = Field(..., description="Event date (Unix timestamp in milliseconds)")
    title: str = Field(..., description="Event title")
    description: str = Field(..., description="Event description")
    content: Optional[str] = Field(None, description="Event content")
    relatedTickers: list[str] = Field(
        ..., 
        alias="relatedTickers",
        description="List of related stock tickers"
    )

    class Config:
        populate_by_name = True


class EventMovementIndicator(BaseModel):
    """Price movement indicators following an event"""
    eventId: str = Field(..., alias="eventId", description="Related event ID")
    ticker: str = Field(..., description="Stock ticker symbol")
    priceAtEvent: float = Field(..., alias="priceAtEvent", description="Stock price at event time")
    priceAfter1d: Optional[float] = Field(None, alias="priceAfter1d", description="Price 1 day after event")
    priceAfter1w: Optional[float] = Field(None, alias="priceAfter1w", description="Price 1 week after event")
    priceAfter1m: Optional[float] = Field(None, alias="priceAfter1m", description="Price 1 month after event")
    changePercent1d: Optional[float] = Field(
        None, 
        alias="changePercent1d",
        description="Percentage change 1 day after event"
    )
    changePercent1w: Optional[float] = Field(
        None, 
        alias="changePercent1w",
        description="Percentage change 1 week after event"
    )
    changePercent1m: Optional[float] = Field(
        None, 
        alias="changePercent1m",
        description="Percentage change 1 month after event"
    )

    class Config:
        populate_by_name = True

