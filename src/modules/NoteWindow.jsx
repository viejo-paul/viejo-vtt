import { useState, useRef, useEffect } from 'react';
import { X, Minus, GripHorizontal } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function NoteWindow({ id, data, onClose, zIndex, onFocus }) {
  const randomOffset = useRef({ x: 50 + Math.floor(Math.random() * 200), y: 50 + Math.floor(Math.random() * 100) });
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-note-${id}`, randomOffset.current);
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
      className="absolute w-64 bg-yellow-100 dark:bg-yellow-900/90 text-yellow-900 dark:text-yellow-100 rounded-lg shadow-xl overflow-hidden border border-yellow-300 dark:border-yellow-700 flex flex-col transition-transform duration-200"
    >
      <div 
        onMouseDown={handleStart} onTouchStart={handleStart}
        className="p-2 bg-yellow-200 dark:bg-yellow-950/50 cursor-grab active:cursor-grabbing flex justify-between items-center select-none"
      >
        <GripHorizontal size={16} className="opacity-50" />
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-black/10 rounded"><Minus size={14} /></button>
          <button onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded"><X size={14} /></button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-3 text-sm font-handwriting">
          <p className="whitespace-pre-wrap">{data.text}</p>
          <div className="mt-2 text-[10px] opacity-60 text-right italic">{data.author}</div>
        </div>
      )}
    </div>
  );
}

export default NoteWindow;