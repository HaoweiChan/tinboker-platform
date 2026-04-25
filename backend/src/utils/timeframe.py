"""
Timeframe utility functions for filtering chart data
"""
from typing import List
from datetime import datetime, timedelta
from src.models.stock import ChartDataPoint

# Valid timeframe options
VALID_TIMEFRAMES = {'1H', '1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'}


def is_valid_timeframe(timeframe: str) -> bool:
    """
    Check if timeframe string is valid.
    
    Args:
        timeframe: Timeframe string to validate
        
    Returns:
        True if valid, False otherwise
    """
    return timeframe in VALID_TIMEFRAMES


def filter_chart_data_by_timeframe(
    chart_data: List[ChartDataPoint],
    timeframe: str
) -> List[ChartDataPoint]:
    """
    Filter chart data based on timeframe option.
    
    Args:
        chart_data: List of ChartDataPoint objects to filter
        timeframe: Timeframe option (1H, 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL)
        
    Returns:
        Filtered list of ChartDataPoint objects
        
    Raises:
        ValueError: If timeframe is not valid
    """
    if not is_valid_timeframe(timeframe):
        raise ValueError(f"Invalid timeframe: {timeframe}. Valid options: {', '.join(sorted(VALID_TIMEFRAMES))}")
    
    if not chart_data:
        return []
    
    if timeframe == 'ALL':
        return chart_data
    
    # Get current time in milliseconds
    now = datetime.now()
    now_timestamp = int(now.timestamp() * 1000)
    
    # Calculate start timestamp based on timeframe
    start_timestamp = None
    
    if timeframe == '1H':
        # Last 1 hour - note: daily data may not have intraday granularity
        # Return most recent data point(s) or empty if no recent data
        start_timestamp = int((now - timedelta(hours=1)).timestamp() * 1000)
    elif timeframe == '1D':
        # Last 24 hours
        start_timestamp = int((now - timedelta(days=1)).timestamp() * 1000)
    elif timeframe == '1W':
        # Last 7 days
        start_timestamp = int((now - timedelta(days=7)).timestamp() * 1000)
    elif timeframe == '1M':
        # Last 30 days
        start_timestamp = int((now - timedelta(days=30)).timestamp() * 1000)
    elif timeframe == '3M':
        # Last 90 days
        start_timestamp = int((now - timedelta(days=90)).timestamp() * 1000)
    elif timeframe == '6M':
        # Last 180 days
        start_timestamp = int((now - timedelta(days=180)).timestamp() * 1000)
    elif timeframe == '1Y':
        # Last 365 days
        start_timestamp = int((now - timedelta(days=365)).timestamp() * 1000)
    elif timeframe == 'YTD':
        # Year to date - from January 1st of current year
        year_start = datetime(now.year, 1, 1)
        start_timestamp = int(year_start.timestamp() * 1000)
    
    if start_timestamp is None:
        return chart_data
    
    # Filter chart data by timestamp
    filtered = [point for point in chart_data if point.timestamp >= start_timestamp]
    
    return filtered

