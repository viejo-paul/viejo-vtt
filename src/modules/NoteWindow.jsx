import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText, Lock, Users } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';
// import ReactMarkdown from 'react-markdown'; // Descomenta si lo instalaste

function NoteWindow({ id, data, onClose }) {
  // Posición aleatoria REAL para que no se apilen (rango 0-200px)
  // Usamos un ref para que la posición inicial solo se calcule al montar y no en re-renders
  const randomPos = useRef({ 
      x: 100 + Math.floor(Math.random() * 300), 
      y: 50 + Math.floor(Math.random() * 200) 
  });
  
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-note-${id}`, randomPos.current);
  
  // TAMAÑO INICIAL MÁS GRANDE (Estilo Handout)
  const [size, setSize] = useState({ w: 450, h: 550 });
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
        setSize({ w: Math.max(300, startSize.current.w + deltaX), h: Math.max(200, startSize.current.h + deltaY) });
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
  }, [isDragging, isResizing]);

  const isPrivate = data.targets && (data.targets.length === 0 || (data.targets.length === 1 && data.targets[0] === data.author));

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: isMinimized ? '280px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px` }}
      className="absolute z-40 bg-[#fdfbf7] dark:bg-neutral-800 border border-[#e8e4dc] dark:border-neutral-600 rounded-lg shadow-2xl flex flex-col overflow-hidden font-serif"
    >
      {/* BARRA SUPERIOR (Más limpia) */}
      <div 
        onMouseDown={handleStart} onTouchStart={handleStart} 
        className="bg-[#f5f2eb] dark:bg-neutral-900 border-b border-[#e8e4dc] dark:border-white/10 p-2 cursor-grab active:cursor-grabbing flex justify-between items-center select-none h-9"
      >
        <div className="flex items-center gap-2 overflow-hidden text-neutral-600 dark:text-neutral-400">
           {isPrivate ? <Lock size={12}/> : <Users size={12}/>}
           <span className="text-xs font-bold truncate">{data.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
           <button onMouseDown={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="w-6 h-6 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 rounded"><Minus size={14} /></button>
           <button onMouseDown={e=>e.stopPropagation()} onClick={onClose} className="w-6 h-6 flex items-center justify-center hover:bg-red-500 hover:text-white rounded"><X size={14} /></button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar text-neutral-800 dark:text-neutral-200 relative">
          
          {/* IMAGEN */}
          {data.image && (
            <div className="mb-4 -mx-5 -mt-5">
              <img src={data.image} alt="Adjunto" className="w-full h-auto max-h-[300px] object-cover" />
            </div>
          )}
          
          {/* CONTENIDO (Estilo Papel) */}
          <div className="prose dark:prose-invert prose-sm max-w-none leading-relaxed whitespace-pre-wrap font-serif text-base">
             {/* Si usaras ReactMarkdown: <ReactMarkdown>{data.content}</ReactMarkdown> */}
             {data.content}
          </div>

          {/* PIE DE PÁGINA (Autor) */}
          <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10 flex justify-between items-end text-[10px] text-neutral-400 uppercase tracking-widest font-sans">
            <span>Ref: #{data.id.toString().slice(-4)}</span>
            <span>Aut: {data.author}</span>
          </div>

          {/* RESIZE HANDLE */}
          <div 
            onMouseDown={(e) => { e.stopPropagation(); setIsResizing(true); startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; }} 
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-20 hover:opacity-100"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-black dark:border-white"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoteWindow;