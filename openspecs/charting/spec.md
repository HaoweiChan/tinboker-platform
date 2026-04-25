# charting Specification

## Purpose
TBD - created by archiving change enhance-stock-chart. Update Purpose after archive.
## Requirements
### Requirement: Backend Aggregation Logic
The backend **MUST** support fetching data for extended timeframes beyond simple daily/intraday views to support weekly and monthly charts.

#### Scenario: Backend Data Fetching
- **Given** `timeframe` parameter is provided to the API
- **When** value is '1W' or '1M'
- **Then** the API maps to appropriate Massive API timespans for weekly/monthly data

#### Scenario: MA visibility logic
- **Given** the chart configuration includes MA visibility settings
- **When** individual MA toggles are provided (MA5, MA20, MA60)
- **Then** each MA line can be shown/hidden independently via granular props or a config object

