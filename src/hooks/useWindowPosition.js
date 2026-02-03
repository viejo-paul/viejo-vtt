import { useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

export function useWindowPosition(key, initialPos, size = { w: 280, h: 50 }) {
  const [pos, setPos] = usePersistentState(key, initialPos);

  const keepInBounds = (x, y) => {
    const maxX = window.innerWidth - size.w;
    const maxY = window.innerHeight - size.h;
    return {
      x: Math.min(Math.max(x, 0), maxX),
      y: Math.min(Math.max(y, 0), maxY)
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const validated = keepInBounds(pos.x, pos.y);
      if (validated.x !== pos.x || validated.y !== pos.y) {
        setPos(validated);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pos.x, pos.y, size.w, size.h]); // Escuchamos cambios en posición y tamaño

  return [pos, setPos, keepInBounds];
}