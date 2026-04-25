# monitoring-integration Specification

## Purpose
TBD - created by archiving change add-admin-dashboard. Update Purpose after archive.
## Requirements
### Requirement: Netdata Docker Integration
The system SHALL include Netdata as a Docker service for container and VPS monitoring.

#### Scenario: Netdata container deployment
- **GIVEN** the docker-compose configuration
- **WHEN** `docker compose up` is executed
- **THEN** the Netdata container SHALL start
- **AND** it SHALL collect metrics from all running containers
- **AND** it SHALL collect VPS system metrics (CPU, RAM, disk, network)

#### Scenario: Netdata resource limits
- **GIVEN** the VPS has limited resources (8GB RAM)
- **WHEN** Netdata runs
- **THEN** it SHALL be configured with:
  - 1-hour retention (reduced from default)
  - Disabled unnecessary collectors
  - Memory limit of 512MB max

#### Scenario: Container metrics collection
- **GIVEN** Netdata is running
- **WHEN** Docker containers are active
- **THEN** Netdata SHALL collect per-container:
  - CPU usage percentage
  - Memory usage
  - Network I/O
  - Restart count

### Requirement: Netdata Reverse Proxy
Netdata SHALL be accessible only via authenticated reverse proxy.

#### Scenario: Proxy routing
- **GIVEN** Caddy is configured as reverse proxy
- **WHEN** a request is made to `/netdata/*`
- **THEN** it SHALL be proxied to `http://netdata:19999/*`
- **AND** the response SHALL include headers allowing iframe embedding

#### Scenario: Direct port blocked
- **GIVEN** Netdata runs on port 19999
- **WHEN** an external request attempts to access port 19999 directly
- **THEN** the connection SHALL be refused (not exposed in docker-compose)

### Requirement: System Status API
The backend SHALL expose an API endpoint for application-level health metrics.

#### Scenario: Status endpoint access
- **GIVEN** a valid admin JWT token
- **WHEN** GET `/api/admin/system/status` is called
- **THEN** the response SHALL return system status in JSON format
- **AND** the response SHALL include timestamp

#### Scenario: Database pool metrics
- **GIVEN** PostgreSQL is enabled
- **WHEN** the status endpoint is called
- **THEN** it SHALL include database pool information:
  - `pool_size`: Maximum connections
  - `active`: Currently in-use connections
  - `idle`: Available connections

#### Scenario: Redis connection status
- **GIVEN** Redis is configured
- **WHEN** the status endpoint is called
- **THEN** it SHALL include Redis status:
  - `connected`: boolean
  - `memory_mb`: Current memory usage

#### Scenario: Backend service health
- **GIVEN** the backend is running
- **WHEN** the status endpoint is called
- **THEN** it SHALL include:
  - `status`: "healthy" | "degraded" | "unhealthy"
  - `uptime_seconds`: Time since service start

### Requirement: Application Metrics
The system SHALL track basic application-level metrics.

#### Scenario: API response tracking
- **GIVEN** requests are made to the API
- **WHEN** the status endpoint is called
- **THEN** it MAY include (future enhancement):
  - Request count in last minute
  - Average response time
  - Error rate (5xx responses)

### Requirement: Health Check Enhancement
Docker healthchecks SHALL be enhanced for better monitoring.

#### Scenario: Backend healthcheck
- **GIVEN** the backend container is running
- **WHEN** Docker performs a health check
- **THEN** it SHALL call `GET /health`
- **AND** the response SHALL include:
  - Database connectivity status
  - Redis connectivity status
  - Overall health status

