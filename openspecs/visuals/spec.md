# visuals Specification

## Purpose
TBD - created by archiving change update-episode-card-visuals. Update Purpose after archive.
## Requirements
### Requirement: Visual Styling
The Episode Card MUST implement the specific visual style defined in the design comp, including theme-specific colors and borders. The implementation MUST match the visual targets provided in the assets directory:

**Light Theme Target:**
![Light Theme](../assets/design-light.png)

**Dark Theme Target:**
![Dark Theme](../assets/design-dark.png)

#### Scenario: Dark Mode Display
- **GIVEN** the application is in dark mode
- **WHEN** the `EpisodeCard` is rendered
- **THEN** it MUST use the background color `slate-900` (or equivalent from design tokens).
- **AND** it MUST NOT have a white border.
- **AND** the text color MUST be `slate-50` or `slate-200`.
- **AND** it MUST NOT have any shining/gradient animation on hover.

#### Scenario: Light Mode Display
- **GIVEN** the application is in light mode
- **WHEN** the `EpisodeCard` is rendered
- **THEN** it MUST use the background color `white`.
- **AND** it MUST have a subtle `slate-200` border.
- **AND** the text color MUST be `slate-900`.

### Requirement: Interaction Design
The card MUST respond to user interaction with specific hover effects to enhance engagement.

#### Scenario: Hover Effect
- **GIVEN** the user hovers over the card
- **THEN** the card MUST elevate with a shadow.
- **AND** the visual style MUST match the hover targets provided in the assets directory (highlighting text and border):

**Light Theme Hover Target:**
![Light Theme Hover](../assets/hover-light.png)

**Dark Theme Hover Target:**
![Dark Theme Hover](../assets/hover-dark.png)

- **AND** a "Read Full Summary" (or similar arrow link) MUST become more prominent or change color.

### Requirement: Component Content
The card content MUST be structured to highlight key insights effectively.

#### Scenario: Key Insights Rendering
- **GIVEN** the episode has `key_insights` (or mapped `keyInsights`)
- **WHEN** the card renders
- **THEN** it MUST display a section titled "關鍵洞察" (Key Insights).
- **AND** it MUST display a Green Lightbulb icon next to the title.
- **AND** it MUST list the insights as bullet points.

#### Scenario: Interaction Buttons
- **GIVEN** the card renders
- **THEN** it MUST disable a "Play" button.
- **AND** it MUST display a "Share" button (e.g., share icon) for sharing the podcast episode.
- **AND** tags MUST be displayed at the bottom left.
- **AND** a "Call to Action" (Read Summary) MUST be at the bottom right.

### Requirement: Standardization
The Episode Card MUST maintain a consistent visual appearance across the entire application.

#### Scenario: Global Usage
- **GIVEN** the `EpisodeCard` component is used in:
    - Landing Page
    - Tag Pages
    - Podcaster Pages
    - Stock Dashboards
- **THEN** it MUST visually match the design defined in "Visual Styling" (specifically the Landing Page look).
- **AND** it MUST NOT have deviated styles or variants unless explicitly defined in this spec.

