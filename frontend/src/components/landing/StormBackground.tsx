import React, { useEffect, useRef } from 'react';

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

export const StormBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const initVanta = async () => {
      try {
        if (!window.THREE) {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        }
        if (!window.VANTA) {
          await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.fog.min.js');
        }
        if (containerRef.current && window.VANTA?.FOG) {
          effectRef.current = window.VANTA.FOG({
            el: containerRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            highlightColor: 0xaebceb,
            midtoneColor: 0x27272a,
            lowlightColor: 0x09090b,
            baseColor: 0x000000,
            blurFactor: 0.85,
            speed: 0.8,
            zoom: 0.6,
          });
        }
      } catch (error) {
        console.error('Failed to initialize Vanta effect', error);
      }
    };

    initVanta();

    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden />;
};


