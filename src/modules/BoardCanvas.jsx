import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Map as MapIcon } from 'lucide-react';

function BoardCanvas({ src, isGM, onConfigBackground }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false); 
  
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null); 

  useEffect(() => { centerImage(); }, [src]);
  const centerImage = () => { setScale(1); setPosition({ x: 0, y: 0 }); };

  const handleWheel = (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    setScale(Math.max(0.1, Math.min(5, scale + direction * 0.1)));
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  // Lógica Táctil (Móvil)
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    } else if (e.touches.length === 2) {
      lastTouchDistance.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      setPosition({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
    } else if (e.touches.length === 2 && lastTouchDistance.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist - lastTouchDistance.current;
      setScale(Math.max(0.1, Math.min(5, scale + delta * 0.005)));
      lastTouchDistance.current = dist;
    }
  };

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden bg-neutral-200 dark:bg-neutral-900 cursor-grab active:cursor-grabbing select-none touch-none"
      onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => { setIsDragging(false); lastTouchDistance.current = null; }}
    >
      {src && (
        <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s ease-out', transformOrigin: 'center center' }} className="w-full h-full flex items-center justify-center pointer-events-none">
            <img src={src} alt="Tablero" className="max-w-[90%] max-h-[90%] object-contain shadow-2xl ring-1 ring-black/10" draggable={false} />
        </div>
      )}

      {isGM && (
         <div className="absolute top-28 left-6 z-20" onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}>
            <button onClick={onConfigBackground} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-white hover:bg-neutral-500 border border-neutral-300 dark:border-white/10 transition-all shadow-xl" title="Configurar Tablero"><MapIcon size={20} /></button>
         </div>
      )}

      <div className={`absolute left-6 z-20 flex flex-col items-center gap-2 transition-all duration-300 ${isGM ? 'top-44' : 'top-28'}`} onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()}>
        <button onClick={() => setIsZoomOpen(!isZoomOpen)} className={`bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full border border-neutral-300 dark:border-white/10 transition-all shadow-xl ${isZoomOpen ? 'bg-neutral-100 dark:bg-white/20 text-emerald-500' : 'text-neutral-500 dark:text-neutral-400 hover:text-white hover:bg-neutral-500'}`}><ZoomIn size={20} /></button>
        <div className={`flex flex-col items-center gap-1 bg-white dark:bg-neutral-900/80 backdrop-blur-md rounded-full border border-neutral-300 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-300 origin-top ${isZoomOpen ? 'max-h-64 p-1 opacity-100' : 'max-h-0 p-0 opacity-0 pointer-events-none'}`}>
            <button onClick={() => setScale(s => Math.min(5, s + 0.2))} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-600 dark:text-neutral-300"><ZoomIn size={18} /></button>
            <div className="h-24 w-8 flex items-center justify-center py-2 relative">
              <input type="range" min="0.1" max="5" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="absolute w-24 h-8 -rotate-90 bg-transparent cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-neutral-200 dark:[&::-webkit-slider-runnable-track]:bg-neutral-700 [&::-webkit-slider-runnable-track]:h-1" />
            </div>
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-600 dark:text-neutral-300"><ZoomOut size={18} /></button>
            <div className="h-px w-4 bg-neutral-200 dark:bg-white/10 my-0.5"></div>
            <button onClick={centerImage} className="p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-600 dark:text-neutral-300"><Maximize size={18} /></button>
        </div>
      </div>
    </div>
  );
}
export default BoardCanvas;