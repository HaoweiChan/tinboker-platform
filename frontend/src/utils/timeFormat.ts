/**
 * Utility functions for time formatting and conversion
 */

/**
 * Convert milliseconds to HH:MM:SS format
 * @param milliseconds Time in milliseconds
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatTimeFromMs(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Format with leading zeros
  const hoursStr = hours.toString().padStart(2, '0');
  const minutesStr = minutes.toString().padStart(2, '0');
  const secondsStr = seconds.toString().padStart(2, '0');

  // If hours is 0, return MM:SS format, otherwise return HH:MM:SS
  if (hours === 0) {
    return `${minutesStr}:${secondsStr}`;
  }
  return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

/**
 * Convert seconds to HH:MM:SS format (for Spotify API which uses seconds)
 * @param seconds Time in seconds
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatTimeFromSeconds(seconds: number): string {
  return formatTimeFromMs(seconds * 1000);
}

/**
 * Parse time code from markdown pattern (#time: milliseconds)
 * @param text Markdown text containing time codes
 * @returns Array of { match: string, milliseconds: number, formattedTime: string }
 */
export function parseTimeCodes(text: string): Array<{ match: string; milliseconds: number; formattedTime: string; seconds: number }> {
  const timeCodeRegex = /\(#time:\s*(\d+)\)/g;
  const matches: Array<{ match: string; milliseconds: number; formattedTime: string; seconds: number }> = [];
  let match;

  while ((match = timeCodeRegex.exec(text)) !== null) {
    const milliseconds = parseInt(match[1], 10);
    const seconds = Math.floor(milliseconds / 1000);
    matches.push({
      match: match[0],
      milliseconds,
      formattedTime: formatTimeFromMs(milliseconds),
      seconds
    });
  }

  return matches;
}

/**
 * Replace time codes in markdown with formatted time links
 * @param markdown Markdown text containing time codes
 * @returns Markdown with time codes replaced as links
 */
export function replaceTimeCodesWithLinks(markdown: string): string {
  return markdown.replace(/\(#time:\s*(\d+)\)/g, (_match, msStr) => {
    const milliseconds = parseInt(msStr, 10);
    const seconds = Math.floor(milliseconds / 1000);
    const formattedTime = formatTimeFromMs(milliseconds);
    // Create a markdown link that will be handled by our custom component
    return `[${formattedTime}](#time:${seconds})`;
  });
}

/**
 * Replace time codes in markdown with formatted time links and add newline after each link
 * @param markdown Markdown text containing time codes
 * @returns Markdown with time codes replaced as links, with newlines after each link
 */
export function replaceTimeCodesWithLinksAndNewline(markdown: string): string {
  return markdown.replace(/\(#time:\s*(\d+)\)/g, (_match, msStr) => {
    const milliseconds = parseInt(msStr, 10);
    const seconds = Math.floor(milliseconds / 1000);
    const formattedTime = formatTimeFromMs(milliseconds);
    // Create a markdown link that will be handled by our custom component, with newline after
    return `[${formattedTime}](#time:${seconds})\n`;
  });
}

