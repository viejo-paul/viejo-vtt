import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, Maximize, Map as MapIcon } from 'lucide-react';

function BoardCanvas({ src, isGM, onConfigBackground }) { // Nuevas props
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset al cambiar imagen
  useEffect(() => {
    centerImage();
  }, [src]);

  const centerImage = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const factor = 0.1;
    const newScale = Math.max(0.1, Math.min(5, scale + direction * factor));
    setScale(newScale);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => setIsDragging(false);

  // MANEJADOR DEL SLIDER
  const handleSliderChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden bg-neutral-200 dark:bg-neutral-900 cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* CAPA IMAGEN */}
        {src ? (
            <div 
                style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                transformOrigin: 'center center'
                }}
                className="w-full h-full flex items-center justify-center pointer-events-none"
            >
                <img 
                    src={src} 
                    alt="Tablero" 
                    className="max-w-[90%] max-h-[90%] object-contain shadow-2xl ring-1 ring-black/10"
                    draggable={false} 
                />
            </div>
        ) : null}

      {/* CONTROLES FLOTANTES IZQUIERDA */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 z-20 flex flex-col gap-4" onMouseDown={e => e.stopPropagation()}>
        
        {/* GRUPO 1: CONFIGURACIÓN (Solo GM) */}
        {isGM && (
             <div className="bg-white dark:bg-black/60 backdrop-blur rounded-lg border border-neutral-300 dark:border-white/10 shadow-lg p-1">
                <button 
                    onClick={onConfigBackground} 
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-emerald-600 dark:text-emerald-500 transition-colors" 
                    title="Configurar Tablero"
                >
                    <MapIcon size={20} />
                </button>
             </div>
        )}

        {/* GRUPO 2: ZOOM Y PAN */}
        <div className="bg-white dark:bg-black/60 backdrop-blur rounded-lg border border-neutral-300 dark:border-white/10 shadow-lg p-1 flex flex-col items-center gap-1">
          <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-600 dark:text-neutral-300" title="Acercar">
            <ZoomIn size={20} />
          </button>
          
          {/* SLIDER VERTICAL */}
          <div className="h-24 w-6 flex items-center justify-center py-2 relative">
             {/* Usamos appearance-none y rotamos el input */}
             <input 
                type="range" 
                min="0.1" max="5" step="0.1" 
                value={scale} 
                onChange={handleSliderChange}
                className="absolute w-24 h-6 -rotate-90 bg-transparent cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-200 dark:[&::-webkit-slider-runnable-track]:bg-neutral-700 [&::-webkit-slider-runnable-track]:h-1"
                title="Nivel de Zoom"
             />
          </div>

          <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-600 dark:text-neutral-300" title="Alejar">
            <ZoomOut size={20} />
          </button>
          
          <div className="h-px w-full bg-neutral-200 dark:bg-white/10 my-0.5"></div>
          
          <button onClick={centerImage} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded text-neutral-600 dark:text-neutral-300" title="Centrar Mapa">
            <Maximize size={20} />
          </button>
        </div>
        
        {/* ETIQUETA PORCENTAJE */}
        <div className="bg-black/70 text-white text-[10px] font-bold py-1 px-2 rounded-full text-center backdrop-blur shadow-md">
          {Math.round(scale * 100)}%
        </div>
      </div>
    </div>
  );
}

export default BoardCanvas;