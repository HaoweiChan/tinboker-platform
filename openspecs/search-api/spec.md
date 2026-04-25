# search-api Specification

## Purpose
TBD - created by archiving change enhance-search-experience. Update Purpose after archive.
## Requirements
### Requirement: Fast Fuzzy Suggestions
The `/suggest` endpoint MUST return results within 50ms and support fuzzy matching for partial inputs (e.g., "tsm" -> "TSMC", "台積" -> "台積電").

#### Scenario: Partial English Match
Given a user inputs "nvd"
When the search suggestion API is called
Then it should return "NVDA" as the top result with type "stock"

#### Scenario: Partial Chinese Match
Given a user inputs "台積"
When the search suggestion API is called
Then it should return "2330" (台積電) as the top result with type "stock"

### Requirement: Real Trending Data
The `/popular` endpoint MUST return trending items based on actual platform data, replacing all mock data.

#### Scenario: Trending Stocks (Mentions)
- **Source**: Mentions in episodes from the last 7 days (via `episodes` table `related_tickers`).
- **Ranking**: Frequency of mentions desc.

#### 3. Trending Channels (Podcasters) - "熱門頻道"
- **Source**: User behavior analytics (Clicks/Views on website).
- **Metric**: Click popularity (Redis Sorted Set).
- **Ranking**: Click count desc.

### Requirement: Analytics API
The system MUST provide endpoints to track user analytics.

#### POST /api/analytics/click
- **Purpose**: Record user interaction for trending algorithms.
- **Payload**: `{ type: "podcast" | "stock", id: string }`
- **Behavior**: Increment score in Redis Sorted Set (e.g., `trending:clicks:podcast`).

#### Scenario: Trending Podcasters (Activity)
Given multiple podcasts have released episodes
When the popular search API is called
Then the "podcasts" section should return channels sorted by most recent upload (matching "Active Channels" logic)

### Requirement: Trending Stock Calculation
The backend MUST calculate the percentage change over the sparkline period (30 days) for trending stocks.

#### Scenario: 30-Day Change Calculation
Given a stock has 30 days of price data in its sparkline
When the trending stocks endpoint is called
Then the response metadata MUST include `change_percent_30d` calculated as `(last_price - first_price) / first_price`.

