import { useState, useRef, useEffect } from 'react';
import { X, Minus, ScrollText, Trash2 } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useWindowPosition } from '../hooks/useWindowPosition';

const DieShape = ({ sides, color, value }) => {
  let path = sides === 4 ? "M12 2L2 22h20L12 2z" : sides === 6 ? "M3 3h18v18H3z" : "M12 2L2 12l10 10 10-10L12 2z";
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
  const [position, setPosition, keepInBounds] = useWindowPosition('vtt-history-pos', { x: 400, y: 50 }, size);
  const [isMinimized, setIsMinimized] = usePersistentState('vtt-history-minimized', false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) setPosition(keepInBounds(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
      if (isResizing) {
        setSize({ w: Math.max(250, startSize.current.w + (e.clientX - startSize.current.x)), h: Math.max(150, startSize.current.h + (e.clientY - startSize.current.y)) });
      }
    };
    const handleMouseUp = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, isResizing, size]);

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: isMinimized ? '288px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px`, transition: (isDragging || isResizing) ? 'none' : 'all 0.3s ease' }}
      className="absolute z-30 w-72 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div onMouseDown={(e) => { if (!isResizing) { setIsDragging(true); dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } }} className="bg-neutral-100 dark:bg-white/5 p-3 cursor-grab active:cursor-grabbing flex justify-between items-center border-b border-neutral-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs uppercase text-neutral-500 dark:text-neutral-400 font-bold truncate">
          <ScrollText size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0"/> <span className="truncate">Historial</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onClear} className="text-neutral-500 hover:text-red-500 p-1"><Trash2 size={14} /></button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white p-1"><Minus size={16} /></button>
          <button onClick={onClose} className="text-neutral-500 hover:text-red-500 p-1"><X size={16} /></button>
        </div>
      </div>
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-neutral-50/50 dark:bg-transparent custom-scrollbar">
          {logs.map((log) => (
            <div key={log.id} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-neutral-200 dark:border-white/5 shadow-sm">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono font-bold">{log.time}</span>
              <div className="flex flex-wrap gap-3 items-center mt-2">
                {log.results.map((res, i) => <DieShape key={i} {...res} />)}
                <div className="ml-auto text-xs font-black text-neutral-700 dark:text-white bg-neutral-100 dark:bg-black/40 px-2 py-1 rounded border border-neutral-300 dark:border-white/5">TOTAL: {log.results.reduce((a, c) => a + c.value, 0)}</div>
              </div>
            </div>
          ))}
          <div onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; }} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize p-1 opacity-30 hover:opacity-100"><div className="w-2 h-2 border-r-2 border-b-2 border-neutral-400 dark:border-white/50"></div></div>
        </div>
      )}
    </div>
  );
}

export default RollHistory;