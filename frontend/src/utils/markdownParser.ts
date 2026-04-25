
/**
 * Interface for parsed section
 */
export interface ParsedSection {
  title: string;
  content: string;
  timestampSeconds?: number;
  formattedTime?: string;
}

/**
 * Parses markdown text to extract sections based on single hashtag headers (# Title).
 * Supports extracting timestamp from title if format (#time:123) is present.
 * 
 * Logic:
 * 1. Takes raw markdown string.
 * 2. Identifies lines starting with `# ` as headers.
 * 3. Captures content following a header until the next header or end of string.
 * 4. Extracts (#time:seconds) tag from header if present.
 */
export function extractSections(markdown: string): ParsedSection[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  let currentTitle = '';
  let currentTimestamp: number | undefined;
  let currentContentLines: string[] = [];

  // Helper to format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to push current section
  const pushSection = () => {
    // Only push if we have a title. 
    // Content without title (intro text) should be ignored so that the consumer 
    // can decide to use a fallback mechanism (like EpisodeCard does) instead of 
    // rendering an empty-title section.
    if (currentTitle) {
      sections.push({
        title: currentTitle.trim(),
        content: currentContentLines.join('\n').trim(),
        timestampSeconds: currentTimestamp,
        formattedTime: currentTimestamp !== undefined ? formatTime(currentTimestamp) : undefined
      });
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Check for single hashtag header: # Title
    // We'll match specifically lines starting with `#` followed by space or text.

    if (trimmedLine.startsWith('# ')) {
      // New section starting, push previous one
      pushSection();

      // Start new section
      let title = trimmedLine.substring(1).trim();
      currentTimestamp = undefined;

      // Extract time tag (#time:123)
      const timeMatch = title.match(/\(#time:(\d+)\)/);
      if (timeMatch) {
        currentTimestamp = parseInt(timeMatch[1], 10);
        // Remove tag from title and trim
        title = title.replace(/\(#time:\d+\)/, '').trim();
      }

      currentTitle = title;
      currentContentLines = [];
    } else {
      currentContentLines.push(line);
    }
  }

  // Push the last section
  pushSection();

  return sections;
}
