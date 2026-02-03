import { useState, useRef, useEffect } from 'react';
import { X, Minus, ScrollText, Trash2 } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useWindowPosition } from '../hooks/useWindowPosition';

const DieShape = ({ sides, color, value }) => {
  let path = "";
  switch (parseInt(sides)) {
    case 4: path = "M12 2L2 22h20L12 2z"; break;
    case 6: path = "M3 3h18v18H3z"; break;
    case 8: path = "M12 2L2 12l10 10 10-10L12 2z"; break;
    case 10: path = "M12 1L2 11l10 12 10-12L12 1z"; break;
    case 12: path = "M12 2l8.5 6.5v9L12 22l-8.5-4.5v-9L12 2z"; break;
    case 20: path = "M12 2l9 5v10l-9 5-9-5V7z"; break;
    default: path = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"; break;
  }

  return (
    <div className="relative flex items-center justify-center w-10 h-10 transition-transform hover:scale-110">
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md" style={{ fill: color }}>
        <path d={path} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm drop-shadow-md z-10">{value}</span>
      <span className="absolute -bottom-1 -right-1 bg-black/80 text-[8px] px-1 rounded text-white z-20">d{sides}</span>
    </div>
  );
};

function RollHistory({ logs, onClose, onClear }) {
  const [size, setSize] = usePersistentState('vtt-history-size', { w: 320, h: 450 });
  
  // DETECCIÓN DE MÓVIL (Solo una vez)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const initialPos = isMobile ? { x: 10, y: 80 } : { x: 400, y: 50 };

  const [position, setPosition, keepInBounds] = useWindowPosition(
    'vtt-history-pos', 
    initialPos, 
    isMobile ? { w: 280, h: 400 } : size
  );

  const [isMinimized, setIsMinimized] = usePersistentState('vtt-history-minimized', false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // MANEJADORES DE ARRASTRE (Mouse y Touch)
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
      if (isResizing && !e.touches) { // El resize lo dejamos solo para mouse por ahora
        const deltaX = e.clientX - startSize.current.x;
        const deltaY = e.clientY - startSize.current.y;
        setSize({ w: Math.max(250, startSize.current.w + deltaX), h: Math.max(150, startSize.current.h + deltaY) });
      }
    };
    const handleEnd = () => { setIsDragging(false); setIsResizing(false); };

    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing, size]);

  return (
    <div 
      style={{ 
        left: `${position.x}px`, top: `${position.y}px`,
        width: isMinimized ? '288px' : `${size.w}px`,
        height: isMinimized ? 'auto' : `${size.h}px`,
        transition: (isDragging || isResizing) ? 'none' : 'all 0.3s ease'
      }}
      className="absolute z-30 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* BARRA TÍTULO CON SOPORTE TÁCTIL */}
      <div 
        onMouseDown={handleStart} 
        onTouchStart={handleStart}
        className="bg-neutral-100 dark:bg-white/5 p-3 cursor-grab active:cursor-grabbing flex justify-between items-center border-b border-neutral-200 dark:border-white/10"
      >
        <div className="flex items-center gap-2 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-bold truncate">
          <ScrollText size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0"/>
          <span className="truncate">Historial</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={onClear} className="text-neutral-500 hover:text-red-500 p-1"><Trash2 size={14} /></button>
          <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="text-neutral-500 hover:text-black dark:hover:text-white p-1"><Minus size={16} /></button>
          <button onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={onClose} className="text-neutral-500 hover:text-red-500 p-1"><X size={16} /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-neutral-50/50 dark:bg-transparent custom-scrollbar">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 opacity-50"><p className="text-xs italic">Vacío</p></div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-neutral-200 dark:border-white/5 shadow-sm">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono font-bold">{log.time}</span>
                <div className="flex flex-wrap gap-3 items-center mt-2">
                  {log.results.map((res, i) => <DieShape key={i} {...res} />)}
                  <div className="ml-auto text-xs font-black text-neutral-700 dark:text-white bg-neutral-100 dark:bg-black/40 px-2 py-1 rounded border border-neutral-300 dark:border-white/5">TOTAL: {log.results.reduce((a, c) => a + c.value, 0)}</div>
                </div>
              </div>
            ))
          )}
          
          {/* RESIZE (Solo mouse para evitar líos en móvil) */}
          {!isMobile && (
            <div 
              onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; }} 
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize p-1 opacity-30 hover:opacity-100"
            >
              <div className="w-2 h-2 border-r-2 border-b-2 border-neutral-400 dark:border-white/50"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RollHistory;