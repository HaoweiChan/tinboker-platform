# admin-auth Specification

## Purpose
TBD - created by archiving change add-stock-translation-system. Update Purpose after archive.
## Requirements
### Requirement: Password Authentication
The system SHALL authenticate admin users via a single shared password stored in Google Secret Manager.

#### Scenario: Successful login
- **GIVEN** the `ADMIN_PASSWORD` secret exists in Google Secret Manager
- **WHEN** a POST request is made to `/api/admin/auth/login` with the correct password
- **THEN** the response SHALL return `{"access_token": "<jwt>", "token_type": "bearer", "expires_in": 86400}`

#### Scenario: Failed login
- **GIVEN** the `ADMIN_PASSWORD` secret is configured
- **WHEN** a POST request is made to `/api/admin/auth/login` with an incorrect password
- **THEN** the response SHALL return 401 Unauthorized

### Requirement: JWT Token Validation
The system SHALL validate JWT tokens for protected admin endpoints.

#### Scenario: Valid token
- **GIVEN** a valid JWT token obtained from login
- **WHEN** a request is made to a protected admin endpoint with `Authorization: Bearer <token>`
- **THEN** the request SHALL be processed

#### Scenario: Missing token
- **GIVEN** no Authorization header is provided
- **WHEN** a request is made to a protected admin endpoint
- **THEN** the response SHALL return 401 Unauthorized

#### Scenario: Expired token
- **GIVEN** a JWT token that has expired (>24 hours old)
- **WHEN** a request is made to a protected admin endpoint with the expired token
- **THEN** the response SHALL return 401 Unauthorized with message indicating expiration

#### Scenario: Invalid token
- **GIVEN** a malformed or tampered JWT token
- **WHEN** a request is made to a protected admin endpoint
- **THEN** the response SHALL return 401 Unauthorized

### Requirement: Token Configuration
The system SHALL use JWT settings from Google Secret Manager.

#### Scenario: JWT secret from Secret Manager
- **GIVEN** the `ADMIN_JWT_SECRET` secret exists in Google Secret Manager
- **WHEN** tokens are generated
- **THEN** they SHALL be signed with the secret from Secret Manager

#### Scenario: Missing JWT secret
- **GIVEN** the `ADMIN_JWT_SECRET` secret is not accessible
- **WHEN** the application starts in production
- **THEN** it SHALL fail with a clear error message

#### Scenario: Development fallback
- **GIVEN** the application runs in development mode
- **AND** Secret Manager is not configured
- **WHEN** the application starts
- **THEN** it SHALL fall back to `ADMIN_JWT_SECRET` environment variable or generate a random secret (with warning log)

### Requirement: Frontend Token Management
The frontend SHALL manage authentication tokens for admin operations.

#### Scenario: Login flow
- **GIVEN** an unauthenticated user visits `/admin/translations`
- **WHEN** the page loads
- **THEN** the user SHALL be shown a login form

#### Scenario: Token storage
- **GIVEN** a successful login
- **WHEN** the JWT token is received
- **THEN** it SHALL be stored in localStorage

#### Scenario: Auto-redirect on auth failure
- **GIVEN** a stored token that has expired or is invalid
- **WHEN** an API request returns 401
- **THEN** the user SHALL be redirected to the login form

