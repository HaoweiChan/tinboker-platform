# news-ui Specification

## Purpose
TBD - created by archiving change enhance-news-view. Update Purpose after archive.
## Requirements
### Requirement: Use Backend Data for Assets and Tags
The frontend MUST stop parsing Markdown content to extract assets and tags. Instead, it SHALL use the `related_tickers` and `tags` fields provided by the backend API.

#### Scenario: Backend Data Integration
- **Given** I am viewing a News/Podcast page
- **When** the page loads
- **Then** the "Related Assets" and "Tags" should be populated directly from the API response (`related_tickers`, `tags`)
- **And** the frontend should NOT parse the markdown content to find tickers or tags

### Requirement: Debug Tabs Visibility
Debug-only sections SHALL be hidden in production environments to avoid confusing users.

#### Scenario: Debug View (Dev Branch)
- **Given** I am viewing the News page in Development mode
- **Then** I should see "Events" (事件) and "Sentences" (逐字稿) tabs if data exists

### Requirement: Marp Slide Visualization
The News page SHALL render Marp markdown content as a visual slide carousel if available.

#### Scenario: Slides Display
- **Given** I am viewing a News/Podcast page with `marp_markdown_content`
- **When** the page loads
- **Then** the slides SHALL be displayed as a horizontally scrollable list of images
- **And** the height of the slide strip SHALL be constrained (e.g., to 60 units) to allow viewing multiple slides at once
- **And** the Marp metadata/frontmatter (first line) SHALL be removed and not displayed
- **And** the slides SHALL be rendered correctly using `rehype-raw`

#### Scenario: Slide Interaction
- **Given** the slide strip is visible
- **When** I click on a slide
- **Then** the slide SHALL open in a full-screen or large modal (Lightbox) for detailed viewing

### Requirement: Deprecate Interactive Model
The interactive model feature is deprecated. Usage SHALL be disabled in the UI by commenting out the rendering logic in the View, ensuring it is hidden from the user.

#### Scenario: Interactive Model Visibility
- **Given** I am viewing a News page
- **When** the page loads
- **Then** the Interactive Model visualization widget should NOT be visible in the sidebar
- **But** the code for it should remain in the codebase (commented out)

### Requirement: UI Polish
The UI SHALL improve the visual alignment of timestamp buttons.

#### Scenario: Timestamp Alignment
- **Given** I am viewing an article with timestamp links
- **Then** the timestamp buttons (e.g. `01:02`) should be vertically aligned with the surrounding text

#### Scenario: Episode Info Header Alignment
- **Given** I am viewing the episode header (Source Name and Date)
- **Then** the Source Name link and the Date (with icon) should be perfectly vertically centered relative to each other

### Requirement: Slide Visibility
The Slide Visualization MUST maintain legibility regardless of the application theme.

#### Scenario: Slide Background
- **Given** the application is in Dark Mode
- **And** the slides have transparent backgrounds
- **Then** the Slide Viewer container MUST force a lighter background (e.g. white) for the slides themselves
- **So That** the black text of the slides remains visible
- **And** the slide strip should support smooth horizontal scrolling for instant browsing

### Requirement: Cross-Tab Player Synchronization
The global Spotify player SHALL synchronize its state across all browser tabs for the same user session using the BroadcastChannel API.

#### Scenario: Player Opens in New Tab
- **GIVEN** the user has the website open in Tab A and Tab B
- **WHEN** the user opens the player in Tab A
- **THEN** the player MUST also become visible in Tab B
- **AND** both tabs MUST display the same episode information

#### Scenario: Episode Change Sync
- **GIVEN** the player is open in Tab A and Tab B
- **WHEN** the user changes to a different episode in Tab A
- **THEN** Tab B MUST update to show the new episode
- **AND** the previous playback in Tab B MUST be replaced

#### Scenario: Player Close Sync
- **GIVEN** the player is open in Tab A and Tab B
- **WHEN** the user closes the player in Tab A
- **THEN** the player MUST also close in Tab B

#### Scenario: Seek Request Sync
- **GIVEN** the player is open in Tab A and Tab B
- **WHEN** the user seeks to a timestamp in Tab A
- **THEN** Tab B MUST receive the seek request
- **AND** Tab B MUST seek to the same position

### Requirement: Interactive Timestamp Markers on Progress Bar
The player progress bar SHALL display clickable timestamp markers for each chapter/section, with hover tooltips and click-to-seek functionality.

#### Scenario: Timestamp Markers Display
- **GIVEN** the player is open with an episode that has timestamped sections
- **WHEN** the progress bar is rendered
- **THEN** each section timestamp SHALL be displayed as a vertical marker on the progress bar
- **AND** markers SHALL be positioned proportionally based on timestamp relative to total duration

#### Scenario: Marker Hover Tooltip
- **GIVEN** timestamp markers are visible on the progress bar
- **WHEN** the user hovers over a marker
- **THEN** a tooltip MUST appear showing the section title
- **AND** the tooltip MUST be positioned above the marker

#### Scenario: Marker Click to Seek
- **GIVEN** timestamp markers are visible on the progress bar
- **WHEN** the user clicks on a marker
- **THEN** the playback MUST seek to that timestamp
- **AND** the progress bar MUST update to reflect the new position

### Requirement: Expandable Chapter List
The player SHALL provide an expandable panel showing a list of all chapters/sections with timestamps for easy navigation.

#### Scenario: Chapter List Toggle
- **GIVEN** the player is open with an episode that has timestamped sections
- **WHEN** the user clicks the expand/collapse button
- **THEN** the chapter list panel SHALL toggle between expanded and collapsed states

#### Scenario: Current Chapter Highlight
- **GIVEN** the chapter list is expanded
- **WHEN** playback is in progress
- **THEN** the current chapter MUST be visually highlighted
- **AND** the highlight MUST update as playback progresses through chapters

#### Scenario: Chapter Click Navigation
- **GIVEN** the chapter list is expanded
- **WHEN** the user clicks on a chapter item
- **THEN** the playback MUST seek to that chapter's timestamp

