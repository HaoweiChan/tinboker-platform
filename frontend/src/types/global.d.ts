export {};

declare global {
  interface Window {
    VANTA?: {
      FOG?: (options: Record<string, unknown>) => { destroy: () => void };
    };
    THREE?: unknown;
  }
}
