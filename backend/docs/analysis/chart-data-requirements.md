# Chart Data Requirements Analysis: TradingView & Yahoo Finance

## Overview

This document analyzes what data granularity and structure professional charting platforms like TradingView and Yahoo Finance require to display flawless stock charts, and compares it with our current implementation.

---

## Professional Chart Requirements

### 1. Data Granularity by Timeframe

| Timeframe | TradingView/YFinance | Ideal Data Points | Required Granularity |
|-----------|---------------------|-------------------|---------------------|
| **1H** | 60-120 points | 60-120 | **Minute-level** (1-min bars) |
| **1D** | 390-780 points | 390-780 | **Minute-level** (1-2 min bars) |
| **1W** | 35-70 points | 35-70 | **Hourly** (hourly bars) |
| **1M** | 20-30 points | 20-30 | **Daily** (daily bars) |
| **3M** | 60-90 points | 60-90 | **Daily** (daily bars) |
| **6M** | 120-180 points | 120-180 | **Daily** (daily bars) |
| **1Y** | 252 points | 252 | **Daily** (daily bars) |

### 2. OHLCV Data Structure

**Required Fields:**
- ✅ **Open**: Opening price of the bar
- ✅ **High**: Highest price during the bar period
- ✅ **Low**: Lowest price during the bar period
- ✅ **Close**: Closing price of the bar
- ✅ **Volume**: Trading volume during the bar period
- ✅ **Timestamp**: Unix timestamp in milliseconds
- ✅ **Date**: ISO date string (YYYY-MM-DD) for daily+ granularity

**Why OHLCV is Critical:**
- **Candlestick charts** require all four prices (OHLC) to render properly
- **Volume bars** require volume data
- **Line charts** can use just Close, but OHLC provides more context
- **Technical indicators** (RSI, MACD, etc.) often need OHLC data

### 3. Data Point Density

**US Stock Market Trading Hours:**
- Regular hours: 9:30 AM - 4:00 PM ET (6.5 hours = 390 minutes)
- Pre-market: 4:00 AM - 9:30 AM ET (optional)
- After-hours: 4:00 PM - 8:00 PM ET (optional)

**Minimum Data Points Needed:**
- **1H timeframe**: 60-120 minute bars for smooth rendering
- **1D timeframe**: 390 minute bars (full trading day)
- **1W timeframe**: 35-70 hourly bars (7 days × 5-10 hours/day)
- **1M+ timeframes**: Daily bars are sufficient

### 4. Real-Time Updates

**WebSocket Requirements:**
- Updates every 1-5 seconds during market hours
- Smooth transitions when new data arrives
- Handles gaps and missing data gracefully
- Supports multiple timeframes simultaneously

---

## Our Current Implementation

### ✅ What We Have

1. **OHLCV Data Structure**: ✅ Complete
   - Open, High, Low, Close, Volume all present
   - Timestamp in milliseconds
   - Date string for daily data

2. **Daily Aggregates**: ✅ Working
   - Fetches last 30 days of daily OHLCV data
   - Proper conversion to ChartDataPoint format
   - Caching implemented

3. **WebSocket Support**: ✅ Implemented
   - Real-time price updates via `/ws/prices`
   - Redis Pub/Sub for scalability
   - Supports multiple tickers

4. **Timeframe Filtering**: ✅ Implemented
   - Filters daily data by timeframe
   - Supports all timeframe options

### ⚠️ What We're Missing for 1H/1D

1. **Minute-Level Aggregates**: ❌ Not fetched
   - Currently only fetches daily aggregates
   - No minute-level data for intraday charts

2. **Data Point Density**: ❌ Insufficient for 1H/1D
   - **1H**: Returns 0-1 points (need 60+)
   - **1D**: Returns 1-2 points (need 390+)

3. **Intraday Granularity**: ❌ Missing
   - No minute/hourly bars for short timeframes
   - Can't show intraday price movements

---

## Solution: Fetching Appropriate Granularity

### Implementation Strategy

**1. Timeframe-Based Data Fetching:**

```python
# Pseudo-code for data collection
if timeframe in ['1H', '1D']:
    # Fetch minute-level aggregates
    data = massive_service.get_minute_aggregates(
        ticker=ticker,
        from_date=calculate_start_date(timeframe),
        to_date=now
    )
elif timeframe in ['1W']:
    # Fetch hourly aggregates (or aggregate minutes to hours)
    data = massive_service.get_hourly_aggregates(...)
else:
    # Use daily aggregates (current implementation)
    data = massive_service.get_daily_aggregates(...)
```

**2. Data Point Targets:**

- **1H**: Fetch last 60-120 minutes of minute bars
- **1D**: Fetch last 24 hours of minute bars (or aggregate to 5-min/15-min bars)
- **1W**: Aggregate minutes to hourly bars, or fetch hourly directly
- **1M+**: Daily aggregates (current implementation is fine)

**3. Aggregation Options:**

If minute-level data is too granular for display:
- **1D with 5-min bars**: 78 bars (390 minutes ÷ 5)
- **1D with 15-min bars**: 26 bars (390 minutes ÷ 15)
- **1D with hourly bars**: 6.5 bars (390 minutes ÷ 60)

**4. Caching Strategy:**

- Cache by `ticker + timeframe + granularity`
- Example: `stock:AAPL:info:1D:minute` vs `stock:AAPL:info:1M:daily`
- Different TTLs: minute data (1-2 min), daily data (5 min)

---

## Massive API Capabilities

### Available Methods

1. **`get_minute_aggregates()`**: ✅ Available
   - Fetches minute-level OHLCV bars
   - Supports date range filtering
   - Returns up to 50,000 bars

2. **`get_second_aggregates()`**: ✅ Available
   - Fetches second-level bars (very granular)
   - Useful for tick-by-tick analysis

3. **Daily Aggregates**: ✅ Currently Used
   - `list_aggs()` with `timespan='day'`
   - What we're currently using

### Implementation Example

```python
# For 1H timeframe
if timeframe == '1H':
    from_date = (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d")
    minute_bars = massive_service.get_minute_aggregates(
        ticker=ticker,
        from_date=from_date,
        to_date=datetime.now().strftime("%Y-%m-%d"),
        limit=120  # Last 120 minutes
    )
    # Convert to ChartDataPoint format
    chart_data = convert_minute_bars_to_chart_data(minute_bars)

# For 1D timeframe
elif timeframe == '1D':
    from_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    minute_bars = massive_service.get_minute_aggregates(
        ticker=ticker,
        from_date=from_date,
        to_date=datetime.now().strftime("%Y-%m-%d"),
        limit=780  # Last 24 hours = 1440 minutes, but market is ~390 minutes
    )
    # Optionally aggregate to 5-min or 15-min bars for better performance
    chart_data = aggregate_minute_bars(minute_bars, interval=5)  # 5-min bars
```

---

## Comparison: Current vs Required

### 1H Timeframe

| Aspect | TradingView/YFinance | Our Current | Gap |
|--------|---------------------|-------------|-----|
| Data Points | 60-120 | 0-1 | ❌ 60-119 points missing |
| Granularity | Minute-level | Daily | ❌ Wrong granularity |
| Smoothness | Smooth curve | Single point | ❌ No curve possible |

### 1D Timeframe

| Aspect | TradingView/YFinance | Our Current | Gap |
|--------|---------------------|-------------|-----|
| Data Points | 390-780 | 1-2 | ❌ 388-778 points missing |
| Granularity | Minute-level | Daily | ❌ Wrong granularity |
| Intraday Detail | Full day movements | Just open/close | ❌ No intraday detail |

### 1M+ Timeframes

| Aspect | TradingView/YFinance | Our Current | Status |
|--------|---------------------|-------------|--------|
| Data Points | 20-30 | 20-30 | ✅ Sufficient |
| Granularity | Daily | Daily | ✅ Correct |
| Detail Level | Daily movements | Daily movements | ✅ Matches |

---

## Recommendations

### Short-Term (Quick Fix)

1. **Document Limitations**: Update README to clarify that 1H/1D timeframes currently return daily data only
2. **Frontend Handling**: Frontend can aggregate/filter daily data for 1H/1D, but won't show true intraday detail

### Medium-Term (Proper Implementation)

1. **Implement Minute-Level Fetching**: 
   - Modify `DataCollectionService` to fetch minute aggregates for 1H/1D timeframes
   - Add timeframe-aware data fetching logic

2. **Add Aggregation Logic**:
   - Optionally aggregate minute bars to 5-min or 15-min bars for 1D timeframe
   - Reduces data points while maintaining detail

3. **Update Caching**:
   - Separate cache keys for minute vs daily data
   - Shorter TTL for minute data (1-2 minutes)

### Long-Term (Enhanced Features)

1. **Multiple Granularity Support**:
   - Allow frontend to request specific granularity (1-min, 5-min, 15-min, hourly, daily)
   - Backend fetches and aggregates accordingly

2. **Real-Time Intraday Updates**:
   - WebSocket already supports this
   - Publisher worker can stream minute-level updates
   - Frontend can append to existing chart data

---

## Conclusion

**For flawless charts like TradingView/Yahoo Finance:**

1. **1H/1D timeframes** require **minute-level aggregates** (60-390+ data points)
2. **1W+ timeframes** work fine with **daily aggregates** (current implementation)
3. **OHLCV structure** is already correct ✅
4. **WebSocket support** is already implemented ✅

**The main gap:** We need to fetch minute-level data when timeframe is 1H or 1D, instead of just filtering daily data.

