import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText, Image as ImageIcon, Maximize2, File } from 'lucide-react'; // Añadido File icon
import { useWindowPosition } from '../hooks/useWindowPosition';

const RICH_TEXT_STYLES = `
  .rich-text h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
  .rich-text h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5em; }
  .rich-text ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.5em; }
  .rich-text ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.5em; }
  .rich-text p { margin-bottom: 0.5em; }
  .rich-text a { color: #2563eb; text-decoration: underline; }
  .rich-text blockquote { border-left: 3px solid #ccc; padding-left: 1em; color: #666; font-style: italic; }
`;

function ResourceWindow({ id, data, onClose }) {
  const isImage = data.type === 'image';
  const isPdf = data.type === 'pdf'; // Nuevo tipo

  const randomOffset = useRef({ 
    x: 100 + Math.floor(Math.random() * 200), 
    y: 50 + Math.floor(Math.random() * 150) 
  });
  
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-res-${id}`, randomOffset.current);
  
  // PDF e Imagen usan dimensiones más grandes por defecto
  const defaultSize = (isImage || isPdf) ? { w: 500, h: 600 } : { w: 320, h: 400 };
  const [size, setSize] = useState(defaultSize);
  
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
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        setPosition(keepInBounds(clientX - dragOffset.current.x, clientY - dragOffset.current.y));
      }
      if (isResizing && !e.touches) {
        const deltaX = clientX - startSize.current.x;
        const deltaY = clientY - startSize.current.y;
        setSize({ 
          w: Math.max(250, startSize.current.w + deltaX), 
          h: Math.max(200, startSize.current.h + deltaY) 
        });
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
  }, [isDragging, isResizing]);

  // --- ESTILOS DINÁMICOS ---
  // PDF e Imagen usan estilo oscuro. Texto usa estilo papel.
  const containerClasses = (isImage || isPdf)
    ? "bg-neutral-900 border-neutral-700 text-white"
    : "bg-yellow-50 dark:bg-neutral-800 border-yellow-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100";

  const headerClasses = (isImage || isPdf)
    ? "bg-neutral-800 border-neutral-700 text-neutral-300"
    : "bg-yellow-100 dark:bg-neutral-900 border-yellow-200 dark:border-white/10 text-yellow-900 dark:text-yellow-100";

  return (
    <>
      <style>{RICH_TEXT_STYLES}</style>
      <div 
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`, 
          width: isMinimized ? '200px' : `${size.w}px`, 
          height: isMinimized ? 'auto' : `${size.h}px`,
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
        className={`absolute z-40 border rounded-lg shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${containerClasses}`}
      >
        {/* CABECERA */}
        <div 
          onMouseDown={handleStart} onTouchStart={handleStart} 
          className={`p-2 border-b cursor-grab active:cursor-grabbing flex justify-between items-center select-none ${headerClasses}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {isImage ? <ImageIcon size={14} /> : (isPdf ? <File size={14}/> : <FileText size={14} />)}
            <span className="text-xs font-bold truncate">{data.title || 'Sin Título'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
             <button onMouseDown={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded">
               {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
             </button>
             <button onMouseDown={e=>e.stopPropagation()} onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded">
               <X size={14} />
             </button>
          </div>
        </div>

        {/* CONTENIDO */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* CASO 1: IMAGEN */}
            {isImage && (
              <div className="flex-1 bg-black flex items-center justify-center overflow-auto">
                <img src={data.content || data.url} alt={data.title} className="max-w-full h-auto object-contain" draggable={false} />
              </div>
            )}

            {/* CASO 2: PDF */}
            {isPdf && (
              <div className="flex-1 bg-neutral-200 overflow-hidden">
                 {/* Usamos object para embeber el PDF. Si es Base64 funciona nativamente en Chrome/Firefox modernos */}
                 <object 
                    data={data.content} 
                    type="application/pdf" 
                    className="w-full h-full"
                 >
                    <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
                        <p>Tu navegador no puede previsualizar este PDF.</p>
                        <a href={data.content} download="documento.pdf" className="text-blue-600 underline">Descargar PDF</a>
                    </div>
                 </object>
              </div>
            )}

            {/* CASO 3: TEXTO */}
            {!isImage && !isPdf && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {data.attachment && (
                  <div className="mb-4 rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
                    <img src={data.attachment} alt="Adjunto" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div 
                  className="rich-text text-sm md:text-base leading-relaxed break-words font-serif"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />
                <div className="mt-6 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] opacity-50 italic text-right">
                  Creado por {data.author}
                </div>
              </div>
            )}

            {/* RESIZE HANDLE */}
            <div 
              onMouseDown={(e) => { 
                e.stopPropagation(); 
                setIsResizing(true); 
                startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; 
              }} 
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 hover:opacity-100 z-50"
            >
              <div className="w-2 h-2 border-r-2 border-b-2 border-current opacity-50"></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ResourceWindow;