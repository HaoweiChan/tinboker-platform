/**
 * Generate a thumbnail for a graph using canvas API
 * This captures the current viewport of the ReactFlow graph
 */

export async function generateGraphThumbnail(
  reactFlowInstance: any,
  width: number = 400,
  height: number = 300
): Promise<string | null> {
  try {
    if (!reactFlowInstance) {
      return null;
    }

    // Get the ReactFlow container element
    const container = reactFlowInstance.getNodes()[0]?.parentElement;
    if (!container) {
      return null;
    }

    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return null;
    }

    // Fill background
    ctx.fillStyle = '#0F172A'; // Dark slate background
    ctx.fillRect(0, 0, width, height);

    // Draw nodes as circles (simplified representation)
    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach((node: any) => {
      const x = node.position.x;
      const y = node.position.y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });

    if (nodes.length === 0) {
      return null;
    }

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const scaleX = (width - 40) / graphWidth;
    const scaleY = (height - 40) / graphHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    const offsetX = (width - graphWidth * scale) / 2 - minX * scale;
    const offsetY = (height - graphHeight * scale) / 2 - minY * scale;

    // Draw edges
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    edges.forEach((edge: any) => {
      const sourceNode = nodes.find((n: any) => n.id === edge.source);
      const targetNode = nodes.find((n: any) => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const x1 = sourceNode.position.x * scale + offsetX;
        const y1 = sourceNode.position.y * scale + offsetY;
        const x2 = targetNode.position.x * scale + offsetX;
        const y2 = targetNode.position.y * scale + offsetY;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node: any) => {
      const x = node.position.x * scale + offsetX;
      const y = node.position.y * scale + offsetY;
      const radius = 8;

      // Node circle
      ctx.fillStyle = '#3B82F6'; // Blue color
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = '#1E40AF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Convert to base64
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    return null;
  }
}

/**
 * Generate a simple placeholder thumbnail
 */
export function generatePlaceholderThumbnail(title: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  gradient.addColorStop(0, '#1E293B');
  gradient.addColorStop(1, '#0F172A');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 300);

  // Title text
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.slice(0, 20), 200, 150);

  return canvas.toDataURL('image/png');
}

