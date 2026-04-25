# admin-dashboard Specification

## Purpose
TBD - created by archiving change add-admin-dashboard. Update Purpose after archive.
## Requirements
### Requirement: Admin Layout Structure
The system SHALL provide a persistent admin layout with sidebar navigation.

#### Scenario: Admin page access
- **GIVEN** an authenticated admin user
- **WHEN** navigating to `/admin`
- **THEN** the page SHALL display a sidebar with navigation links
- **AND** the main content area SHALL show the dashboard home

#### Scenario: Sidebar navigation
- **GIVEN** the admin layout is displayed
- **WHEN** the user views the sidebar
- **THEN** it SHALL contain links to:
  - Dashboard (home)
  - Translations
- **AND** the current section SHALL be visually highlighted

#### Scenario: Mobile responsiveness
- **GIVEN** the admin page is viewed on mobile (&lt;768px)
- **WHEN** the page loads
- **THEN** the sidebar SHALL be collapsible via a menu button
- **AND** content SHALL be full-width when sidebar is collapsed

### Requirement: Dashboard Home Page
The dashboard home SHALL provide a quick overview of system status and metrics.

#### Scenario: Status cards display
- **GIVEN** the admin dashboard home is loaded
- **WHEN** the page renders
- **THEN** it SHALL display status cards for:
  - Docker container status (Backend, Redis)
  - Database connection pool health
  - Application uptime

#### Scenario: Status card states
- **GIVEN** a status card is displayed
- **WHEN** the underlying service status is checked
- **THEN** the card SHALL show one of: "healthy" (green), "warning" (yellow), "error" (red)

#### Scenario: Netdata embed
- **GIVEN** Netdata is running and accessible
- **WHEN** the dashboard home loads
- **THEN** it SHALL embed Netdata charts via iframe
- **AND** the embed SHALL be resizable/scrollable

### Requirement: Page Routing
The admin section SHALL have clean URL routing.

#### Scenario: Route structure
- **GIVEN** the React Router configuration
- **WHEN** admin routes are defined
- **THEN** they SHALL follow the pattern:
  - `/admin` → Dashboard home
  - `/admin/translations` → Translation management
  - `/admin/*` → Extensible for future sections

#### Scenario: Unauthenticated access
- **GIVEN** an unauthenticated user visits `/admin`
- **WHEN** the page loads
- **THEN** the user SHALL be redirected to the admin login form
- **AND** after successful login, return to the requested admin page

### Requirement: Translations Integration
The existing translation management SHALL be integrated into the admin layout.

#### Scenario: Translations page under admin
- **GIVEN** the user navigates to `/admin/translations`
- **WHEN** the page loads
- **THEN** it SHALL display within the admin layout
- **AND** the sidebar SHALL highlight the Translations link
- **AND** all existing translation functionality SHALL work unchanged

