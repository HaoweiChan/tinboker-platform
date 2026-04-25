# Add Episode Re-generation Feature and Enhance SlideViewer with Marp Integration

## Summary
This PR adds a re-generation feature for episode summaries in the NewsPage and enhances the SlideViewer component with full Marp markdown support. It also includes improvements to the recommendations tab and better handling of ticker-specific Marp content.

## Changes

### ✨ New Features

#### 1. Episode Re-generation Feature (`NewsPage.tsx`)
- Added a re-generate button (RotateCw icon) next to the "編輯摘要" (Edit Summary) button
- Allows users to trigger re-generation of episode summaries via API
- Features:
  - Spinning icon animation during API call
  - Proper loading state management
  - Error handling with user-friendly alerts
  - Uses centralized API client for consistent error handling
- **API Endpoint**: `POST /api/podcast/{podcastName}/episodes/{episodeId}/regenerate`
- Only visible in non-production environments

#### 2. Enhanced SlideViewer Component (`src/components/common/SlideViewer.tsx`)
- Integrated full Marp markdown parser support using `@marp-team/marp-core`
- Added dynamic slide dimension handling (no longer hardcoded to 1280x720)
- Added support for interactive features:
  - `onTickerClick` callback for ticker symbol interactions
  - `onTagClick` callback for tag interactions
  - Episode metadata props (id, title, source, spotifyUri)
  - Timestamped sections support
- Improved slide parsing and frontmatter handling
- Proper Marp HTML rendering with CSS support

#### 3. Recommendations Tab Support (`NewsPage.tsx`)
- Added recommendations tab to content navigation
- Parses and displays ticker recommendations from episode data (`ticker_recommendations_content`)
- Proper JSON parsing with error handling
- Tab only appears when recommendations data is available

#### 4. Ticker-Specific Marp Content Support
- Added support for `ticker_marp_markdown_content` field in Episode interface
- Prioritizes ticker-specific Marp content over general Marp content
- Enhanced content display logic in NewsPage

### 🔧 Improvements

#### NewsPage Enhancements
- Updated Marp content handling to prioritize ticker-specific Marp content (`ticker_marp_markdown_content`) over general Marp content
- Improved content tab visibility logic to include recommendations data
- Better state management for recommendations and re-generation features
- Added `regenerateEpisodeSummary` API function in services layer

#### New Utility Files
- **`src/utils/marpParser.ts`**: Marp markdown parsing utilities
  - Frontmatter parsing (`parseMarpFrontmatter`)
  - Slide size parsing (`parseMarpSize`) - extracts dimensions from Marp size directive
  - Slide splitting (`splitMarpSlides`) - properly splits Marp slides by separators
  - HTML rendering (`renderMarpToHTML`) - converts Marp markdown to HTML using Marp core
- **`src/utils/marpPostProcessor.tsx`**: Post-processing for Marp slides
  - Enhanced slide rendering with React component injection
  - Interactive element support (tickers, tags, timestamps)
  - Stock hover card integration
  - Episode navigation support

#### API Service Updates (`src/services/api/index.ts`)
- Added `regenerateEpisodeSummary` function for episode re-generation
- Added `ticker_marp_markdown_content` field to Episode interface
- Added `ticker_recommendations_content` and `ticker_recommendations_public_url` fields to Episode interface

### 📦 Dependencies
- Added `@marp-team/marp-core@^4.2.0` for Marp markdown rendering
- Added `remark-gfm@^4.0.1` for enhanced Markdown support (GitHub Flavored Markdown)

### 🔐 Configuration
- Updated `vite.config.ts` for Marp-related configurations

## Technical Details

### Re-generation Feature Implementation
```typescript
const handleRegenerateEpisode = async () => {
  if (!apiEpisode?.id || !effectivePodcastName || isRegenerating) return;
  
  setIsRegenerating(true);
  try {
    await regenerateEpisodeSummary(effectivePodcastName, apiEpisode.id);
    alert('Regeneration started! The new summary will be available in a few minutes...');
  } catch (error) {
    // Error handling
  } finally {
    setIsRegenerating(false);
  }
};
```

### API Request Format
**Endpoint**: `POST /api/podcast/{podcastName}/episodes/{episodeId}/regenerate`

**Response**: `{ status: string; message: string }`

### SlideViewer Enhancements
- Dynamic sizing based on Marp frontmatter `size` directive
- Proper Marp HTML rendering with embedded CSS
- Support for interactive elements through post-processing
- Improved slide navigation and lightbox functionality

### Recommendations Data Flow
1. Episode data includes `ticker_recommendations_content` (JSON string)
2. Content is parsed on component mount
3. Recommendations tab appears when data is available
4. JSON is displayed in formatted, syntax-highlighted view

## Testing
- [x] Re-generation button appears correctly in non-production environments
- [x] API call succeeds with valid episode_id and podcast name
- [x] Error handling works for API failures
- [x] Loading states display correctly (spinning icon)
- [x] SlideViewer handles Marp content correctly with dynamic sizing
- [x] Recommendations tab displays when data is available
- [x] Ticker-specific Marp content is prioritized over general Marp content
- [x] SlideViewer properly renders Marp HTML with CSS

## Files Changed
- `src/pages/NewsPage.tsx` - Added re-generation feature, recommendations tab, improved Marp handling
- `src/components/common/SlideViewer.tsx` - Enhanced with Marp integration and dynamic sizing
- `src/services/api/index.ts` - Added regeneration API function and new Episode fields
- `src/utils/marpParser.ts` - **NEW** - Marp parsing utilities
- `src/utils/marpPostProcessor.tsx` - **NEW** - Marp post-processing with React integration
- `package.json` - Added new dependencies
- `vite.config.ts` - Updated configuration

## Related Issues
- Implements episode re-generation functionality
- Enhances Marp slide rendering capabilities
- Improves recommendations content display
- Adds support for ticker-specific Marp content

## Notes
- The re-generation feature is only available in non-production environments (`VITE_STAGE !== 'PRODUCTION'`)
- The API endpoint uses the centralized `apiClient` for consistent error handling and authentication
- Future enhancement: Automatically refresh episode data after successful re-generation
- The SlideViewer now supports any slide dimensions specified in Marp frontmatter, not just 1280x720
- Recommendations data is parsed client-side from JSON string stored in episode data