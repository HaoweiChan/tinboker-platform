import type { NavigateFunction } from 'react-router-dom';

/**
 * Handles navigation with support for modifier keys (Cmd/Ctrl) to open in new tab.
 * 
 * @param e The mouse event
 * @param path The path to navigate to
 * @param navigate The react-router-dom navigate function
 */
export const handleNavigation = (
  e: React.MouseEvent | React.KeyboardEvent, 
  path: string, 
  navigate: NavigateFunction
) => {
  // Check for modifier keys (Cmd on Mac, Ctrl on Windows)
  if (e.metaKey || e.ctrlKey) {
    window.open(path, '_blank');
    return;
  }
  
  navigate(path);
};

