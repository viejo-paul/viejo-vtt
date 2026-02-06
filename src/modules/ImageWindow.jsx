import { useState, useRef, useEffect } from 'react';
import { X, Minus, Image as ImageIcon } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function ImageWindow({ id, data, onClose, zIndex, onFocus }) {
  const randomOffset = useRef({ x: 100 + Math.floor(Math.random() * 200), y: 100 + Math.floor(Math.random() * 100) });
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-img-${id}`, randomOffset.current);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    if (e.target.closest('button')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
    if (onFocus) onFocus(); 
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition(keepInBounds(clientX - dragOffset.current.x, clientY - dragOffset.current.y));
    };
    const handleEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, keepInBounds, setPosition]);

  return (
    <div 
      style={{ left: position.x, top: position.y, zIndex: zIndex || 10 }}
      onMouseDown={() => onFocus && onFocus()}
      className="absolute bg-white dark:bg-neutral-800 rounded-lg shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 flex flex-col"
    >
      <div 
        onMouseDown={handleStart} onTouchStart={handleStart}
        className="p-2 bg-neutral-100 dark:bg-neutral-900 cursor-grab active:cursor-grabbing flex justify-between items-center select-none"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300">
           <ImageIcon size={14}/> {data.title || 'Imagen'}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-neutral-500 dark:text-neutral-400"><Minus size={14} /></button>
          <button onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded text-neutral-500 dark:text-neutral-400"><X size={14} /></button>
        </div>
      </div>
      {!isMinimized && (
        <div className="relative group max-w-[80vw] max-h-[70vh] overflow-auto bg-black">
          <img src={data.url} alt="Handout" className="max-w-full h-auto object-contain pointer-events-none" />
        </div>
      )}
    </div>
  );
}

export default ImageWindow;