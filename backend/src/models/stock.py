"""
Stock-related Pydantic models
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class ChartDataPoint(BaseModel):
    """Single OHLCV data point for stock chart"""
    timestamp: int = Field(..., description="Unix timestamp in milliseconds")
    price: float = Field(..., description="Closing price (for backward compatibility)")
    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price")
    low: float = Field(..., description="Lowest price")
    close: float = Field(..., description="Closing price")
    volume: int = Field(..., description="Trading volume")


class StockStats(BaseModel):
    """Additional stock statistics"""
    volume: int = Field(..., description="Trading volume")
    beta: float = Field(..., description="Beta coefficient (volatility relative to market)")
    volatility: float = Field(..., description="Stock volatility")


class CompanyDetail(BaseModel):
    """Detailed company/stock information"""
    model_config = ConfigDict(
        populate_by_name=True  # FastAPI automatically uses by_alias=True when serializing, so aliases will be used
    )
    
    ticker: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    price: float = Field(..., description="Current stock price")
    change: float = Field(..., description="Price change (absolute)")
    changePercent: float = Field(..., alias="changePercent", description="Price change (percentage)")
    marketCap: int = Field(..., alias="marketCap", description="Market capitalization")
    revenue: int = Field(..., description="Annual revenue")
    pe: float = Field(..., description="Price-to-earnings ratio")
    dividendYield: float = Field(..., alias="dividendYield", description="Dividend yield")
    about: str = Field(..., description="Company description")
    stats: StockStats = Field(..., description="Additional statistics")
    chartData: list[ChartDataPoint] = Field(..., alias="chartData", description="Historical OHLCV data")
    icon_url: Optional[str] = Field(None, description="Icon URL (PNG format)")
    logo_url: Optional[str] = Field(None, description="Logo URL (SVG format)")
    icon_image: Optional[str] = Field(None, description="Base64 encoded icon image (PNG format)")
    logo_image: Optional[str] = Field(None, description="Base64 encoded logo image (SVG format)")


class TopMover(BaseModel):
    """Top price mover stock information"""
    model_config = ConfigDict(populate_by_name=True)
    
    ticker: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    price: float = Field(..., description="Current stock price")
    change: float = Field(..., description="Price change (absolute)")
    changePercent: float = Field(..., alias="changePercent", description="Price change (percentage)")

