import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function NoteWindow({ id, data, onClose }) {
  // Posición aleatoria ligera para que no se apilen perfecto
  const randomOffset = Math.floor(Math.random() * 30);
  const initialPos = { x: 100 + randomOffset, y: 100 + randomOffset };
  
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-note-${id}`, initialPos);
  const [size, setSize] = useState({ w: 350, h: 400 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  const handleStart = (e) => {
    if (isResizing) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDragging) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setPosition(keepInBounds(clientX - dragOffset.current.x, clientY - dragOffset.current.y));
      }
      if (isResizing && !e.touches) {
        const deltaX = e.clientX - startSize.current.x;
        const deltaY = e.clientY - startSize.current.y;
        setSize({ w: Math.max(250, startSize.current.w + deltaX), h: Math.max(200, startSize.current.h + deltaY) });
      }
    };
    const handleEnd = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, isResizing, size]);

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: isMinimized ? '250px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px` }}
      className="absolute z-40 bg-yellow-50 dark:bg-neutral-800 border border-yellow-200 dark:border-neutral-600 rounded-lg shadow-xl flex flex-col overflow-hidden font-serif"
    >
      {/* BARRA SUPERIOR */}
      <div 
        onMouseDown={handleStart} onTouchStart={handleStart} 
        className="bg-yellow-100 dark:bg-neutral-900 border-b border-yellow-200 dark:border-white/10 p-2 cursor-grab active:cursor-grabbing flex justify-between items-center select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText size={14} className="text-yellow-700 dark:text-yellow-500 shrink-0"/>
          <span className="text-xs font-bold text-yellow-900 dark:text-yellow-100 truncate">{data.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
           <button onMouseDown={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-yellow-900 dark:text-yellow-100"><Minus size={14} /></button>
           <button onMouseDown={e=>e.stopPropagation()} onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded text-yellow-900 dark:text-yellow-100"><X size={14} /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar text-neutral-800 dark:text-neutral-200 relative group">
          {/* IMAGEN ADJUNTA (SI HAY) */}
          {data.image && (
            <div className="mb-4 rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
              <img src={data.image} alt="Adjunto" className="w-full h-auto object-cover" />
            </div>
          )}
          
          {/* CONTENIDO TEXTO */}
          <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {data.content}
          </div>

          {/* META INFO (Autor) */}
          <div className="mt-6 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] text-neutral-400 italic text-right">
            Escrito por {data.author}
          </div>

          {/* RESIZE HANDLE */}
          <div 
            onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; }} 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-50 hover:opacity-100"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-yellow-400 dark:border-white/30"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteWindow;