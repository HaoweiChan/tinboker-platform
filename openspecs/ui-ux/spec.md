# ui-ux Specification

## Purpose
TBD - created by archiving change modernize-ui. Update Purpose after archive.
## Requirements
### Requirement: Visual Design Standard
The application UI SHALL adhere to a "Modern SaaS" aesthetic characterized by rounded corners, subtle shadows, and high whitespace.

#### Scenario: Card Appearance
- **WHEN** a user views a content card
- **THEN** it should have `rounded-xl` corners and `shadow-sm`
- **AND** on hover, it should elevate with `shadow-md`

### Requirement: Mobile First Content Hierarchy
The sticky navigation bar SHALL contain only essential actions to maintain a clean, uncluttered interface.

#### Scenario: News Page Navigation Minimal
- **WHEN** a user views the NewsPage
- **THEN** the sticky navigation bar contains only essential actions (Back, Bookmark if logged in)
- **AND** redundant duplicate action buttons are not present in the navigation

### Requirement: Contextual Navigation
Users SHALL be able to filter content by clicking on related entities (Stocks).

#### Scenario: Filter by Stock
- **WHEN** a user clicks on a Stock Ticker chip/card
- **THEN** the main content list filters to show only episodes mentioning that stock

### Requirement: Landing Page Hero
The Landing Page Hero section SHALL allow users to quickly understand the value proposition and content freshness.

#### Scenario: Time Freshness
- **WHEN** the page loads
- **THEN** a "Last Updated" or "Latest" indicator is visible near the title

### Requirement: Episode Card Mobile Tag Display
Episode cards SHALL limit (truncate) the number of visible tags on mobile viewports to prevent layout overflow and maintain button accessibility.

#### Scenario: Tag Overflow Prevention
- **WHEN** a user views an episode card on a mobile device (viewport < 768px)
- **AND** the episode has more than 4 tags
- **THEN** only the first 4 tags are shown with a "+N more" indicator
- **AND** the Play, Share, and Bookmark buttons remain fully visible and tappable

#### Scenario: Desktop Full Tag Display
- **WHEN** a user views an episode card on desktop (viewport >= 768px)
- **THEN** all tags are displayed without truncation

### Requirement: News Page Action Toolbar Responsiveness
The News Page action toolbar SHALL adapt its layout based on viewport width to prevent button crowding and maintain usability.

#### Scenario: Mobile Action Toolbar Layout
- **WHEN** a user views the NewsPage on a mobile device (viewport < 640px)
- **THEN** social share buttons (LINE, Facebook, etc.) are hidden from the main toolbar
- **AND** a mobile Share button is visible which opens a menu/dropdown containing these specific social options
- **AND** primary action buttons (Play, Source) remain prominently visible
- **AND** utility buttons show icons only (no text labels)

#### Scenario: Desktop Action Toolbar Layout
- **WHEN** a user views the NewsPage on desktop (viewport >= 640px)
- **THEN** all action buttons are visible with text labels where applicable

