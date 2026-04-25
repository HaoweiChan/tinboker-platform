# pwa-support Specification

## Purpose
TBD - created by archiving change add-pwa-support. Update Purpose after archive.
## Requirements
### Requirement: Web App Manifest
The application SHALL provide a valid Web App Manifest that enables installation on mobile and desktop devices.

#### Scenario: Manifest Validation
- **GIVEN** the application is loaded in a PWA-capable browser
- **WHEN** the browser inspects the manifest
- **THEN** it SHALL find a valid `manifest.json` with:
  - `name` and `short_name` in Traditional Chinese
  - `theme_color` matching brand amber (#f59e0b)
  - `background_color` for splash screen
  - `display` set to `standalone`
  - Icons at 192x192 and 512x512 minimum
  - `start_url` set to `/`

#### Scenario: Install Prompt
- **GIVEN** a user visits the site on a supported browser
- **WHEN** PWA install criteria are met (HTTPS, valid manifest, service worker)
- **THEN** the browser MAY show an install prompt
- **AND** tapping the prompt SHALL install the app to home screen

### Requirement: Service Worker Registration
The application SHALL register a service worker that manages caching and offline functionality.

#### Scenario: SW Registration
- **GIVEN** the application loads in production
- **WHEN** the page finishes loading
- **THEN** a service worker SHALL be registered
- **AND** it SHALL be in active state

#### Scenario: Development Mode
- **GIVEN** the application runs in development mode
- **WHEN** the page loads
- **THEN** the service worker SHALL NOT be registered (to avoid caching issues)

### Requirement: Caching Strategy
The service worker SHALL implement appropriate caching strategies for different resource types.

#### Scenario: Static Asset Caching
- **GIVEN** a user has visited the site once
- **WHEN** they revisit the site
- **THEN** static assets (JS, CSS, images) SHALL be served from cache first
- **AND** network requests SHALL only be made for uncached resources

#### Scenario: API Response Caching
- **GIVEN** a user makes an API request
- **WHEN** network is available
- **THEN** the response SHALL come from network
- **AND** SHALL be cached for offline use

#### Scenario: Offline API Fallback
- **GIVEN** a user is offline
- **WHEN** they request cached API data
- **THEN** the cached response SHALL be served
- **AND** if no cache exists, a graceful error SHALL be shown

### Requirement: PWA Icons
The application SHALL provide correctly sized icons for various platforms and use cases.

#### Scenario: Android Icons
- **GIVEN** a user installs the PWA on Android
- **WHEN** the app appears on home screen
- **THEN** it SHALL display a 192x192 or 512x512 icon
- **AND** adaptive/maskable icons SHALL render correctly in shaped containers

#### Scenario: iOS Icons
- **GIVEN** a user adds the app to home screen on iOS
- **WHEN** the app appears on home screen
- **THEN** it SHALL display the 180x180 apple-touch-icon

### Requirement: Update Notification
The application SHALL notify users when a new version is available and allow them to update.

#### Scenario: Update Available
- **GIVEN** a new service worker is installed
- **WHEN** it is waiting to activate
- **THEN** the UI SHALL show a non-intrusive update notification
- **AND** user action SHALL be required to activate the update

#### Scenario: Update Activation
- **GIVEN** the update notification is shown
- **WHEN** the user clicks "Update"
- **THEN** the page SHALL reload with the new version
- **AND** the new service worker SHALL activate

### Requirement: Apple Meta Tags
The application SHALL include Apple-specific meta tags for optimal iOS PWA experience.

#### Scenario: iOS Status Bar
- **GIVEN** the app is launched as PWA on iOS
- **WHEN** it renders
- **THEN** the status bar style SHALL be set via `apple-mobile-web-app-status-bar-style`
- **AND** `apple-mobile-web-app-capable` SHALL be set to `yes`

