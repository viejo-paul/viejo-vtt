import { useState, useRef, useEffect } from 'react';
import { X, Minus } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function ImageWindow({ id, data, onClose }) {
  // Generamos una posición aleatoria inicial para que no se amontonen si abres muchas
  const randomOffset = Math.floor(Math.random() * 50);
  const initialPos = { x: (window.innerWidth / 2) - 150 + randomOffset, y: (window.innerHeight / 2) - 200 + randomOffset };
  
  // Usamos el ID para que cada ventana recuerde su propia posición
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-win-${id}`, initialPos);
  
  const [size, setSize] = useState({ w: 400, h: 500 });
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
        setSize({ w: Math.max(200, startSize.current.w + deltaX), h: Math.max(150, startSize.current.h + deltaY) });
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
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: isMinimized ? '300px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px` }}
      className="absolute z-50 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all duration-75"
    >
      {/* BARRA NEGRA */}
      <div 
        onMouseDown={handleStart} onTouchStart={handleStart} 
        className="bg-neutral-900 border-b border-white/10 p-2 cursor-grab active:cursor-grabbing flex justify-between items-center text-white"
      >
        <span className="text-xs font-bold uppercase tracking-widest px-2 truncate flex-1">{data.title}</span>
        <div className="flex items-center shrink-0">
           <button onMouseDown={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/20 rounded"><Minus size={14} /></button>
           <button onMouseDown={e=>e.stopPropagation()} onClick={onClose} className="p-1 hover:bg-red-500 rounded"><X size={14} /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 bg-neutral-100 dark:bg-black relative w-full h-full overflow-hidden group">
          
          {/* RENDERIZADO SEGÚN TIPO (PDF vs IMAGEN) */}
          {data.contentType === 'pdf' ? (
             // El pointer-events-none mientras arrastras es vital para que el iframe no robe el foco
            <iframe 
              src={data.src} 
              className={`w-full h-full ${isDragging || isResizing ? 'pointer-events-none' : ''}`} 
              title={data.title}
            />
          ) : (
            <img src={data.src} alt={data.title} className="w-full h-full object-contain pointer-events-none select-none" />
          )}
          
          {/* RESIZE HANDLE */}
          <div 
            onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; }} 
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tl from-black/50 to-transparent"
          >
            <div className="w-3 h-3 border-r-2 border-b-2 border-white drop-shadow-md"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageWindow;