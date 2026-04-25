# backend-caching Specification

## Purpose
TBD - created by archiving change migrate-infrastructure. Update Purpose after archive.
## Requirements
### Requirement: Episode Caching Headers
The API MUST return caching headers for episode-related endpoints.

#### Scenario: Episode Summary Caching
- **GIVEN** a GET request to `/api/podcast/{name}/episodes/{id}`
- **WHEN** the response is successful
- **THEN** the response headers MUST include `Cache-Control: public, max-age=3600, s-maxage=3600` (1 hour).

#### Scenario: Recent Episodes Caching
- **GIVEN** a GET request to `/api/episodes/recent`
- **WHEN** the response is successful
- **THEN** the response headers MUST include `Cache-Control: public, max-age=300` (5 minutes).

