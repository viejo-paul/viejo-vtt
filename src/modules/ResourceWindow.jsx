import { useState, useRef, useEffect } from 'react';
import { X, Minus, FileText, Image as ImageIcon, Maximize2 } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

// Estilos específicos para el contenido HTML (Rich Text)
// Esto hace que las negritas, listas y títulos de Quill se vean bien sin instalar plugins extra
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

  // Posición inicial aleatoria para que no salgan todas una encima de otra
  const randomOffset = useRef({ 
    x: 100 + Math.floor(Math.random() * 200), 
    y: 50 + Math.floor(Math.random() * 150) 
  });
  
  // Hook de posición (persistencia básica en sesión)
  const [position, setPosition, keepInBounds] = useWindowPosition(`vtt-res-${id}`, randomOffset.current);
  
  // Tamaño inicial depende del tipo
  const defaultSize = isImage ? { w: 400, h: 'auto' } : { w: 320, h: 400 };
  const [size, setSize] = useState(defaultSize);
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // --- LÓGICA DE ARRASTRE Y RESIZE ---
  const handleStart = (e) => {
    if (isResizing) return;
    // Solo permitir arrastre desde la cabecera
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
  // Texto: Estilo Nota (Amarillo/Papel)
  // Imagen: Estilo Marco (Oscuro/Neutro)
  const containerClasses = isImage 
    ? "bg-black border-neutral-700 text-white"
    : "bg-yellow-50 dark:bg-neutral-800 border-yellow-200 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100";

  const headerClasses = isImage
    ? "bg-neutral-900 border-neutral-800 text-neutral-300"
    : "bg-yellow-100 dark:bg-neutral-900 border-yellow-200 dark:border-white/10 text-yellow-900 dark:text-yellow-100";

  return (
    <>
      <style>{RICH_TEXT_STYLES}</style>
      <div 
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`, 
          width: isMinimized ? '200px' : `${size.w}px`, 
          height: isMinimized ? 'auto' : (isImage ? 'auto' : `${size.h}px`),
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
            {isImage ? <ImageIcon size={14} /> : <FileText size={14} />}
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
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            
            {/* CASO 1: IMAGEN PURA */}
            {isImage && (
              <div className="bg-black flex items-center justify-center min-h-[200px]">
                <img src={data.content || data.url} alt={data.title} className="w-full h-auto object-contain" draggable={false} />
              </div>
            )}

            {/* CASO 2: TEXTO / NOTA (Puede tener imagen adjunta arriba) */}
            {!isImage && (
              <div className="p-4">
                {/* Imagen adjunta cabecera */}
                {data.attachment && (
                  <div className="mb-4 rounded overflow-hidden border border-black/10 dark:border-white/10 shadow-sm">
                    <img src={data.attachment} alt="Adjunto" className="w-full h-auto object-cover" />
                  </div>
                )}
                
                {/* Contenido HTML Rico */}
                <div 
                  className="rich-text text-sm md:text-base leading-relaxed break-words font-serif"
                  dangerouslySetInnerHTML={{ __html: data.content }}
                />

                {/* Footer del autor */}
                <div className="mt-6 pt-2 border-t border-black/5 dark:border-white/5 text-[10px] opacity-50 italic text-right">
                  Creado por {data.author}
                </div>
              </div>
            )}

            {/* RESIZE HANDLE (Solo si no es imagen pura o si queremos permitir resize en imágenes también) */}
            {/* En imágenes suele ser mejor dejar que el ancho defina el alto automático, pero permitiremos resize horizontal */}
            <div 
              onMouseDown={(e) => { 
                e.stopPropagation(); 
                setIsResizing(true); 
                startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY }; 
              }} 
              className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 hover:opacity-100 z-50"
            >
              <div className={`w-2 h-2 border-r-2 border-b-2 ${isImage ? 'border-white' : 'border-yellow-600 dark:border-neutral-400'}`}></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ResourceWindow;