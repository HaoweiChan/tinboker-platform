# stock-translations Specification

## Purpose
TBD - created by archiving change add-stock-translation-system. Update Purpose after archive.
## Requirements
### Requirement: Translation Data Storage
The system SHALL store stock translations in a PostgreSQL database with the following data model:
- **ticker**: Stock symbol (e.g., "NVDA", "2330")
- **market**: Market code ("US", "TW", "JP")
- **name_en**: English name from data provider
- **name_zh_tw**: Chinese Traditional translation
- **translation_status**: Status indicator ("pending", "approved", "auto")
- **last_updated_by**: Editor identifier
- **timestamps**: Created and last updated times

#### Scenario: Unique ticker-market constraint
- **GIVEN** a translation exists for ticker "NVDA" in market "US"
- **WHEN** another translation is created for the same ticker and market
- **THEN** the system SHALL reject the duplicate with an appropriate error

#### Scenario: Multiple markets for same ticker
- **GIVEN** ticker "2330" exists in market "TW" with name "台積電"
- **WHEN** a translation is created for "2330" in market "JP"
- **THEN** both translations SHALL coexist independently

### Requirement: Public Translation API
The system SHALL provide a public API endpoint to retrieve translations without authentication.

#### Scenario: Fetch existing translation
- **GIVEN** a translation exists for ticker "NVDA" in market "US" with name_zh_tw "輝達"
- **WHEN** a GET request is made to `/api/stocks/translations/NVDA?market=US`
- **THEN** the response SHALL return `{"ticker": "NVDA", "market": "US", "name_en": "NVIDIA CORP", "name_zh_tw": "輝達"}`

#### Scenario: Fetch non-existent translation
- **GIVEN** no translation exists for ticker "UNKNOWN" in market "US"
- **WHEN** a GET request is made to `/api/stocks/translations/UNKNOWN?market=US`
- **THEN** the response SHALL return 404 Not Found

### Requirement: Admin Translation Management
The system SHALL provide authenticated admin API endpoints for managing translations.

#### Scenario: List translations with pagination
- **GIVEN** an authenticated admin user
- **WHEN** a GET request is made to `/api/admin/translations?market=US&page=1&limit=50`
- **THEN** the response SHALL return paginated results with total count

#### Scenario: Create new translation
- **GIVEN** an authenticated admin user
- **WHEN** a POST request is made to `/api/admin/translations` with valid data
- **THEN** the translation SHALL be created and returned with an ID

#### Scenario: Update existing translation
- **GIVEN** an authenticated admin user and an existing translation with ID 123
- **WHEN** a PUT request is made to `/api/admin/translations/123` with new name_zh_tw
- **THEN** the translation SHALL be updated and last_updated_by recorded

#### Scenario: Delete translation
- **GIVEN** an authenticated admin user and an existing translation with ID 123
- **WHEN** a DELETE request is made to `/api/admin/translations/123`
- **THEN** the translation SHALL be removed from the database

### Requirement: Bulk Import
The system SHALL support bulk import of translations via CSV or JSON.

#### Scenario: CSV bulk import
- **GIVEN** an authenticated admin user and a valid CSV file with columns: ticker, market, name_en, name_zh_tw
- **WHEN** a POST request is made to `/api/admin/translations/bulk-import` with the CSV
- **THEN** the system SHALL import new records and update existing ones
- **AND** return counts of imported, updated, and errored records

### Requirement: Missing Translations Report
The system SHALL provide an API to identify stocks missing translations.

#### Scenario: Get missing translations
- **GIVEN** stocks exist in the system without ZH-TW translations
- **WHEN** a GET request is made to `/api/admin/translations/missing?market=US`
- **THEN** the response SHALL return a list of tickers without translations

### Requirement: Admin UI for Translations
The frontend SHALL provide a web interface at `/admin/translations` for managing translations.

#### Scenario: View translation list
- **GIVEN** an authenticated admin user visits `/admin/translations`
- **WHEN** the page loads
- **THEN** the user SHALL see a table of translations with search and filter controls

#### Scenario: Inline editing
- **GIVEN** an authenticated admin user viewing the translation table
- **WHEN** the user clicks on a name_zh_tw cell and edits the value
- **THEN** the change SHALL be saved automatically when the user clicks away

#### Scenario: Filter by market and status
- **GIVEN** an authenticated admin user
- **WHEN** the user selects market "US" and status "pending" from filters
- **THEN** the table SHALL display only matching translations

### Requirement: News Page Translation Display
The frontend news page SHALL display translated stock names when available.

#### Scenario: Display translated name
- **GIVEN** a stock "NVDA" has translation "輝達"
- **WHEN** the stock appears in related assets on the news page
- **THEN** it SHALL be displayed as "NVDA 輝達"

#### Scenario: Fallback to English name
- **GIVEN** a stock "PLTR" has no ZH-TW translation
- **WHEN** the stock appears in related assets on the news page
- **THEN** it SHALL be displayed as "PLTR Palantir Technologies Inc."

