# search-ui Specification

## Purpose
TBD - created by archiving change enhance-search-experience. Update Purpose after archive.
## Requirements
### Requirement: Landing Page Consistency
- **Data Source**: The Landing Page "熱門標的" and "熱門頻道" widgets MUST use the same API endpoint (`/api/search/popular`) as the Search Overlay to ensure data consistency.
- **Labels**:
  - Stocks: Use "熱門標的" (not "Trending Stocks").
  - Channels used "熱門頻道" (not "Trending Podcasters").
- **Visuals**:
  - Consistent icon shapes (Rounded Square for Stocks, Round/Circle for Podcasts/Channels?).
  - **No Double Scrollbars**: Ensure the overlay content handles scrolling correctly without nested scroll containers.
#### Scenario: Stock Icon Rendering
Given a search result is a stock "NVDA"
When the result is displayed in the dropdown
Then it should render a rounded-square icon with the official Clearbit logo
And it should NOT use the generic "TrendingUp" icon

#### Scenario: Podcast Icon Rendering
Given a search result is a podcast "Gooaye"
When the result is displayed in the dropdown
Then it should render `icon_url` provided by the backend (Spotify image)
And it should NOT use the hardcoded internal styling logic

### Requirement: Recent Search History
The application MUST persist the last 10 successful search queries and display them in the "Recent" section of the overlay.

#### Scenario: Adding to History
Given a user searches for "AAPL" and clicks the result
When they open the search bar again
Then "AAPL" should appear in the "Recent" section
And clicking it should immediately execute the search

