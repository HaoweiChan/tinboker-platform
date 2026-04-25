# backend-data Specification

## Purpose
TBD - created by archiving change update-episode-card-visuals. Update Purpose after archive.
## Requirements
### Requirement: Key Insights Data
The backend API MUST provide structured Key Insights data for episodes to support the new visual design.

#### Scenario: Client requests episode details
- **GIVEN** an episode has key insights derived from analysis
- **WHEN** the client requests the episode (or list of episodes)
- **THEN** the response `Episode` object MUST include a `key_insights` field containing a list of strings.
- **AND** if no key insights are available, the field MUST be an empty list or null, but the field MUST be present in the schema.

### Requirement: Mock Data Consistency
The frontend mock data MUST align with the backend contract to facilitate development.

#### Scenario: Mock data consistency
- **GIVEN** the frontend uses mock data for development
- **WHEN** the `Episode` interface is used
- **THEN** it MUST include `keyInsights` (or `key_insights`) to match the backend contract.

