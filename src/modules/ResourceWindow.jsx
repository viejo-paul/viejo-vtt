import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText, Image as ImageIcon, Maximize2, File, Scaling } from 'lucide-react'; 
import { useWindowPosition } from '../hooks/useWindowPosition';
import { usePersistentState } from '../hooks/usePersistentState';

const NOTE_COLORS = {
  default: 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-600',
  yellow: 'bg-yellow-50 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
  red: 'bg-red-50 dark:bg-red-900/40 text-red-900 dark:text-red-100 border-red-200 dark:border-red-700',
  blue: 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700',
  green: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-700',
  purple: 'bg-purple-50 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-700',
  dark: 'bg-neutral-900 text-white border-neutral-700',
};

const NOTE_HEADERS = {
  default: 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200',
  red: 'bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200',
  blue: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200',
  green: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200',
  purple: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200',
  dark: 'bg-neutral-800 text-neutral-400',
};

function ResourceWindow({ id, data, onClose, zIndex, onFocus }) {
  const isImage = data.type === 'image';
  const isPdf = data.type === 'pdf'; 
  const isFrameless = isImage && data.isFrameless; 

  const randomOffset = useRef({ x: 100 + Math.floor(Math.random() * 200), y: 50 + Math.floor(Math.random() * 150) });
  
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-res-${id}`, randomOffset.current);
  const defaultSize = (isImage || isPdf) ? { w: 500, h: 500 } : { w: 400, h: 300 }; 
  const [size, setSize] = usePersistentState(`vtt-res-size-${id}`, defaultSize);
  const [isMinimized, setIsMinimized] = usePersistentState(`vtt-res-min-${id}`, false);
  const [showFramelessControls, setShowFramelessControls] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeDir = useRef('');
  const startResize = useRef({ w: 0, h: 0, x: 0, y: 0, posX: 0, posY: 0 });

  const handleStartDrag = (e) => {
    if (isResizing) return;
    if (e.target.closest('button')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
    if (onFocus) onFocus(); 
  };

  const handleStartResize = (e, dir) => {
    e.stopPropagation(); e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsResizing(true);
    resizeDir.current = dir;
    startResize.current = { w: size.w, h: size.h, x: clientX, y: clientY, posX: position.x, posY: position.y };
    if (onFocus) onFocus(); 
  };

  useEffect(() => {
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) setPosition(keepInBounds(clientX - dragOffset.x, clientY - dragOffset.y));
      
      if (isResizing) {
        const deltaX = clientX - startResize.current.x;
        const deltaY = clientY - startResize.current.y;
        const dir = resizeDir.current;
        let newW = startResize.current.w;
        let newH = startResize.current.h;
        let newX = startResize.current.posX;
        let newY = startResize.current.posY;

        if (dir.includes('e')) newW = Math.max(100, startResize.current.w + deltaX);
        if (dir.includes('s')) newH = Math.max(100, startResize.current.h + deltaY);
        if (dir.includes('w')) {
          const possibleW = Math.max(100, startResize.current.w - deltaX);
          if (possibleW !== 100) { newW = possibleW; newX = startResize.current.posX + deltaX; }
        }
        if (dir.includes('n')) {
          const possibleH = Math.max(100, startResize.current.h - deltaY);
          if (possibleH !== 100) { newH = possibleH; newY = startResize.current.posY + deltaY; }
        }
        setSize({ w: newW, h: newH });
        if (dir.includes('w') || dir.includes('n')) setPosition({ x: newX, y: newY });
      }
    };
    const handleEnd = () => { setIsDragging(false); setIsResizing(false); };
    if (isDragging || isResizing) { window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd); window.addEventListener('touchmove', handleMove); window.addEventListener('touchend', handleEnd); }
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleEnd); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd); };
  }, [isDragging, isResizing, dragOffset]);

  let containerClass = "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white";
  let headerClass = "bg-neutral-100 dark:bg-neutral-900";

  if (isImage || isPdf) {
    containerClass = "bg-neutral-900 border-neutral-700 text-white";
    headerClass = "bg-neutral-800 border-neutral-700 text-neutral-300";
  } else if (data.colorId && NOTE_COLORS[data.colorId]) {
    containerClass = NOTE_COLORS[data.colorId];
    headerClass = NOTE_HEADERS[data.colorId];
  }

  if (isFrameless) {
    containerClass = "bg-transparent border-0 shadow-none pointer-events-none"; 
    headerClass = "hidden";
  }

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, width: isMinimized ? '200px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px`, zIndex: zIndex || 40 }}
      onMouseDown={() => onFocus && onFocus()}
      className={`absolute flex flex-col transition-colors duration-300 ${!isFrameless && 'border rounded-lg shadow-2xl'} ${containerClass}`}
    >
      {!isFrameless && (
        <div 
          onMouseDown={handleStartDrag} onTouchStart={handleStartDrag} 
          onDoubleClick={() => setIsMinimized(!isMinimized)} 
          className={`p-2 border-b cursor-grab active:cursor-grabbing flex justify-between items-center select-none ${headerClass}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isImage ? <ImageIcon size={14} /> : (isPdf ? <File size={14}/> : <FileText size={14} />)}
            <span className="text-xs font-bold truncate">{data.title || 'Sin Título'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
             <button onMouseDown={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">{isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}</button>
             <button onMouseDown={e=>e.stopPropagation()} onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded"><X size={14} /></button>
          </div>
        </div>
      )}
      {!isMinimized && (
        <div className={`flex-1 overflow-hidden relative flex flex-col ${isFrameless ? 'pointer-events-auto' : ''}`}> 
          {isFrameless && (
            <div 
              onMouseDown={handleStartDrag} onTouchStart={handleStartDrag}
              onClick={(e) => { e.stopPropagation(); setShowFramelessControls(!showFramelessControls); }}
              className="w-full h-full relative group cursor-grab active:cursor-grabbing"
            >
              <img src={data.content || data.url} alt="Token" className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xl" />
              {showFramelessControls && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full flex gap-3 shadow-lg animate-in fade-in zoom-in duration-150 z-50">
                   <button onMouseDown={(e) => handleStartResize(e, 'se')} className="hover:text-blue-400 flex items-center gap-1" title="Redimensionar"><Scaling size={14}/></button>
                   <div className="w-px bg-white/20"></div>
                   <button onClick={onClose} className="hover:text-red-400" title="Cerrar"><X size={14}/></button>
                </div>
              )}
              {showFramelessControls && <div className="absolute inset-0 border border-blue-400/50 rounded-lg pointer-events-none"></div>}
            </div>
          )}
          {isImage && !isFrameless && (
             <div className="flex-1 bg-black flex items-center justify-center overflow-auto"><img src={data.content || data.url} alt={data.title} className="max-w-full h-auto object-contain" draggable={false} /></div>
          )}
          {isPdf && (
            <div className="flex-1 bg-neutral-200 overflow-hidden">
                <object data={data.content} type="application/pdf" className="w-full h-full"><div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2"><p>Navegador no soporta PDF.</p><a href={data.content} download="doc.pdf" className="text-blue-600 underline">Descargar</a></div></object>
            </div>
          )}
          {!isImage && !isPdf && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-8"> 
              {data.attachment && (<div className="mb-4 rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm"><img src={data.attachment} alt="Adjunto" className="w-full h-auto object-cover" /></div>)}
              <div className="rich-text text-sm md:text-base leading-relaxed break-words font-serif" dangerouslySetInnerHTML={{ __html: data.content }} />
              <div className="absolute bottom-1 right-2 text-[10px] opacity-50 italic pointer-events-none">Creado por {data.author}</div>
            </div>
          )}
          {(!isFrameless || showFramelessControls) && (
            <>
              <div onMouseDown={(e)=>handleStartResize(e,'se')} onTouchStart={(e)=>handleStartResize(e,'se')} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 opacity-0 hover:opacity-100 touch-none"><div className="w-2 h-2 border-r-2 border-b-2 border-current opacity-50"></div></div>
              <div onMouseDown={(e)=>handleStartResize(e,'sw')} onTouchStart={(e)=>handleStartResize(e,'sw')} className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
              <div onMouseDown={(e)=>handleStartResize(e,'ne')} onTouchStart={(e)=>handleStartResize(e,'ne')} className="absolute top-0 right-0 w-6 h-6 cursor-nesw-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
              <div onMouseDown={(e)=>handleStartResize(e,'nw')} onTouchStart={(e)=>handleStartResize(e,'nw')} className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ResourceWindow;