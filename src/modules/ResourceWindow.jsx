import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText, Image as ImageIcon, Maximize2, File } from 'lucide-react'; 
import { useWindowPosition } from '../hooks/useWindowPosition';

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

function ResourceWindow({ id, data, onClose }) {
  const isImage = data.type === 'image';
  const isPdf = data.type === 'pdf'; 
  const isFrameless = isImage && data.isFrameless; // Modo Token

  const randomOffset = useRef({ x: 100 + Math.floor(Math.random() * 200), y: 50 + Math.floor(Math.random() * 150) });
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-res-${id}`, randomOffset.current);
  
  // Tamaño por defecto más ancho en escritorio
  const defaultSize = (isImage || isPdf) ? { w: 500, h: 500 } : { w: 400, h: 300 }; 
  const [size, setSize] = useState(defaultSize);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Lógica de Redimensionado
  const [isResizing, setIsResizing] = useState(false);
  const resizeDir = useRef(''); // 'se', 'sw', 'ne', 'nw'
  const startResize = useRef({ w: 0, h: 0, x: 0, y: 0, posX: 0, posY: 0 });

  // --- DRAG ---
  const handleStartDrag = (e) => {
    // Si estamos redimensionando, no arrastramos
    if (isResizing) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragOffset({ x: clientX - position.x, y: clientY - position.y });
  };

  // --- RESIZE ---
  const handleStartResize = (e, dir) => {
    e.stopPropagation();
    e.preventDefault(); // Evitar scroll en móvil
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setIsResizing(true);
    resizeDir.current = dir;
    startResize.current = { 
      w: size.w, h: size.h, 
      x: clientX, y: clientY,
      posX: position.x, posY: position.y 
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        setPosition(keepInBounds(clientX - dragOffset.x, clientY - dragOffset.y));
      }
      
      if (isResizing) {
        const deltaX = clientX - startResize.current.x;
        const deltaY = clientY - startResize.current.y;
        const dir = resizeDir.current;
        let newW = startResize.current.w;
        let newH = startResize.current.h;
        let newX = startResize.current.posX;
        let newY = startResize.current.posY;

        // Lógica simple para 4 esquinas
        if (dir.includes('e')) newW = Math.max(200, startResize.current.w + deltaX);
        if (dir.includes('s')) newH = Math.max(150, startResize.current.h + deltaY);
        
        // Para izquierda (w) y arriba (n) es más complejo porque cambia la posición
        if (dir.includes('w')) {
          const possibleW = Math.max(200, startResize.current.w - deltaX);
          if (possibleW !== 200) { // Solo movemos X si realmente cambia el ancho
             newW = possibleW;
             newX = startResize.current.posX + deltaX;
          }
        }
        if (dir.includes('n')) {
          const possibleH = Math.max(150, startResize.current.h - deltaY);
          if (possibleH !== 150) {
            newH = possibleH;
            newY = startResize.current.posY + deltaY;
          }
        }

        setSize({ w: newW, h: newH });
        if (dir.includes('w') || dir.includes('n')) setPosition({ x: newX, y: newY });
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
  }, [isDragging, isResizing, dragOffset]);

  // Estilos
  let containerClass = "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white";
  let headerClass = "bg-neutral-100 dark:bg-neutral-900";

  if (isImage || isPdf) {
    containerClass = "bg-neutral-900 border-neutral-700 text-white";
    headerClass = "bg-neutral-800 border-neutral-700 text-neutral-300";
  } else if (data.colorId && NOTE_COLORS[data.colorId]) {
    containerClass = NOTE_COLORS[data.colorId];
    headerClass = NOTE_HEADERS[data.colorId];
  }

  // Estilo MODO TOKEN (Invisible)
  if (isFrameless) {
    containerClass = "bg-transparent border-0 shadow-none";
    headerClass = "hidden"; // Ocultamos cabecera
  }

  return (
    <div 
      style={{ 
        left: `${position.x}px`, top: `${position.y}px`, 
        width: isMinimized ? '200px' : `${size.w}px`, height: isMinimized ? 'auto' : `${size.h}px`,
        maxWidth: '90vw', maxHeight: '90vh'
      }}
      className={`absolute z-40 flex flex-col overflow-hidden transition-colors duration-300 ${isFrameless ? '' : 'border rounded-lg shadow-2xl'} ${containerClass}`}
    >
      {/* CABECERA (Solo si NO es frameless) */}
      {!isFrameless && (
        <div onMouseDown={handleStartDrag} onTouchStart={handleStartDrag} className={`p-2 border-b cursor-grab active:cursor-grabbing flex justify-between items-center select-none ${headerClass}`}>
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

      {/* CONTENIDO */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden relative flex flex-col">
          
          {/* Si es FRAMELESS, la propia imagen es el 'asa' para arrastrar */}
          {isImage && (
            <div 
              onMouseDown={isFrameless ? handleStartDrag : undefined} 
              onTouchStart={isFrameless ? handleStartDrag : undefined}
              className={`flex-1 flex items-center justify-center overflow-auto ${isFrameless ? 'cursor-move' : 'bg-black'}`}
            >
              <img src={data.content || data.url} alt={data.title} className="w-full h-full object-contain pointer-events-none" />
              
              {/* Botón cerrar flotante solo para frameless (aparece en hover) */}
              {isFrameless && (
                <button 
                   onClick={onClose}
                   className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                >
                  <X size={14}/>
                </button>
              )}
            </div>
          )}

          {isPdf && (
            <div className="flex-1 bg-neutral-200 overflow-hidden">
                <object data={data.content} type="application/pdf" className="w-full h-full">
                  <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2"><p>Navegador no soporta PDF.</p><a href={data.content} download="doc.pdf" className="text-blue-600 underline">Descargar</a></div>
                </object>
            </div>
          )}

          {!isImage && !isPdf && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pb-8"> 
              {data.attachment && (<div className="mb-4 rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm"><img src={data.attachment} alt="Adjunto" className="w-full h-auto object-cover" /></div>)}
              <div className="rich-text text-sm md:text-base leading-relaxed break-words font-serif" dangerouslySetInnerHTML={{ __html: data.content }} />
            </div>
          )}
          
          {/* FOOTER PEGADO AL FONDO */}
          {!isFrameless && (
            <div className="absolute bottom-0 w-full px-2 py-1 bg-inherit/90 backdrop-blur-sm text-[10px] opacity-50 italic text-right border-t border-black/5 dark:border-white/5 pointer-events-none">
              Creado por {data.author}
            </div>
          )}

          {/* MANEJADORES DE RESIZE (4 ESQUINAS) */}
          <div onMouseDown={(e)=>handleStartResize(e,'se')} onTouchStart={(e)=>handleStartResize(e,'se')} className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-50 flex items-end justify-end p-1 opacity-0 hover:opacity-100 touch-none"><div className="w-2 h-2 border-r-2 border-b-2 border-current opacity-50"></div></div>
          <div onMouseDown={(e)=>handleStartResize(e,'sw')} onTouchStart={(e)=>handleStartResize(e,'sw')} className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
          <div onMouseDown={(e)=>handleStartResize(e,'ne')} onTouchStart={(e)=>handleStartResize(e,'ne')} className="absolute top-0 right-0 w-6 h-6 cursor-nesw-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
          <div onMouseDown={(e)=>handleStartResize(e,'nw')} onTouchStart={(e)=>handleStartResize(e,'nw')} className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-50 opacity-0 hover:opacity-100 touch-none"></div>
        </div>
      )}
    </div>
  );
}

export default ResourceWindow;