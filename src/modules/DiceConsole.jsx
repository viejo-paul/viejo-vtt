import { useState, useRef, useEffect } from 'react';
import { Dices, X, Minus, Plus, Trash2, Pipette } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState'; // Solo para cosas que queremos guardar sí o sí
import { useWindowPosition } from '../hooks/useWindowPosition';

function DiceConsole({ onClose, onRoll, storageKey }) {
  const [position, setPosition, keepInBounds] = useWindowPosition('vtt-console-pos', { x: 50, y: 150 }, { w: 288, h: 400 });
  
  // ESTADOS VOLÁTILES (Usamos useState normal para que no se "enganchen")
  const [selectedDie, setSelectedDie] = useState(null);
  const [diceCount, setDiceCount] = useState(1); 
  const [diceColor, setDiceColor] = useState('#e5e5e5'); // <--- AHORA ES useState NORMAL
  const [modifier, setModifier] = useState(0); 

  // ESTADOS PERSISTENTES (Solo configuración de ventana y reserva)
  const [dicePool, setDicePool] = usePersistentState('vtt-console-pool', []);
  const [isMinimized, setIsMinimized] = usePersistentState('vtt-console-minimized', false);

  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const colors = [
    { name: 'Hueso', hex: '#e5e5e5' }, { name: 'Oscuridad', hex: '#171717' },
    { name: 'Esmeralda', hex: '#10b981' }, { name: 'Fuego', hex: '#ef4444' },
    { name: 'Océano', hex: '#3b82f6' }, { name: 'Amatista', hex: '#a855f7' },
    { name: 'Oro', hex: '#eab308' },
  ];

  const addSelectionToPool = () => {
    if (!selectedDie) return;
    // Ahora leerá el color fresco directamente del estado, sin lag de memoria
    setDicePool([...dicePool, { 
      id: Date.now() + Math.random(), 
      sides: selectedDie, 
      qty: diceCount, 
      color: diceColor 
    }]);
  };

  const triggerRoll = () => {
    if (dicePool.length === 0) return;
    const rollConfig = dicePool.map(group => ({
      sides: parseInt(group.sides.replace('d', '')),
      qty: group.qty,
      themeColor: group.color
    }));
    onRoll(rollConfig, parseInt(modifier) || 0);
  };

  // Manejo de arrastre (Touch y Mouse)
  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition(keepInBounds(clientX - dragOffset.current.x, clientY - dragOffset.current.y));
    };
    const handleEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const isCustomColor = !colors.find(c => c.hex === diceColor);

  return (
    <div 
      style={{ left: `${position.x}px`, top: `${position.y}px`, transition: isDragging ? 'none' : 'height 0.3s ease' }}
      className="absolute z-40 w-72 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <div onMouseDown={handleStart} onTouchStart={handleStart} className="p-3 cursor-grab active:cursor-grabbing flex justify-between items-center bg-neutral-100 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-bold">
          <Dices size={16} className="text-emerald-600 dark:text-emerald-500"/> <span>Tirador</span>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={() => setIsMinimized(!isMinimized)} className="text-neutral-500 hover:text-black dark:hover:text-white p-1"><Minus size={16} /></button>
          <button type="button" onMouseDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={onClose} className="text-neutral-500 hover:text-red-500 p-1"><X size={16} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* SELECCIÓN DE DADO */}
          <div className="p-3 bg-neutral-50 dark:bg-black/20 border-b border-neutral-200 dark:border-white/5 grid grid-cols-4 gap-2">
            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
              <button key={d} type="button" onClick={() => setSelectedDie(d)} className={`aspect-square rounded-lg flex items-center justify-center transition-all border ${selectedDie === d ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-white/10 hover:border-emerald-500'}`}>
                <span className="text-xs font-bold uppercase">{d}</span>
              </button>
            ))}
          </div>

          {selectedDie && (
            <div className="p-3 border-b border-neutral-200 dark:border-white/10 space-y-3 bg-white dark:bg-neutral-800/20">
              {/* CONTROLES CANTIDAD */}
              <div className="flex items-center justify-between bg-neutral-100 dark:bg-black/40 rounded-lg p-1 border border-neutral-200 dark:border-white/5">
                <button type="button" onClick={() => setDiceCount(prev => Math.max(1, prev - 1))} className="p-2 text-emerald-600"><Minus size={14}/></button>
                <span className="text-lg font-bold font-mono text-neutral-800 dark:text-white">{diceCount}</span>
                <button type="button" onClick={() => setDiceCount(prev => Math.min(10, prev + 1))} className="p-2 text-emerald-600"><Plus size={14}/></button>
              </div>

              {/* CONTROLES MODIFICADOR */}
              <div className="flex items-center justify-between px-1">
                 <span className="text-[9px] uppercase font-bold text-neutral-400">Modificador</span>
                 <div className="flex items-center bg-neutral-100 dark:bg-black/40 rounded border border-neutral-300 dark:border-white/10">
                   <button onClick={() => setModifier(m => parseInt(m)-1)} className="px-2 py-1 text-neutral-500 hover:text-red-500"><Minus size={10}/></button>
                   <input type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} className="w-10 text-center bg-transparent text-xs font-bold focus:outline-none text-neutral-800 dark:text-white appearance-none" />
                   <button onClick={() => setModifier(m => parseInt(m)+1)} className="px-2 py-1 text-neutral-500 hover:text-emerald-500"><Plus size={10}/></button>
                 </div>
              </div>

              {/* CONTROLES COLOR */}
              <div className="px-1">
                <p className="text-[9px] uppercase text-neutral-400 mb-1 font-bold">Color del dado</p>
                <div className="flex flex-wrap justify-between gap-2 items-center">
                  {colors.map((c) => (
                    <button 
                      key={c.name} 
                      type="button" 
                      onClick={() => setDiceColor(c.hex)} 
                      className={`w-5 h-5 rounded-full border transition-all ${diceColor === c.hex ? 'ring-2 ring-emerald-500 scale-110 shadow-md border-white' : 'opacity-70 border-neutral-300 dark:border-white/20'}`} 
                      style={{ backgroundColor: c.hex }} 
                    />
                  ))}
                  <div className="relative w-5 h-5">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-red-500 flex items-center justify-center ${isCustomColor ? 'ring-2 ring-emerald-500 scale-110 shadow-lg' : 'opacity-70'}`}>
                      <Pipette size={10} className="text-white z-10 pointer-events-none" />
                      <input 
                        type="color" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                        value={diceColor} 
                        onChange={(e) => setDiceColor(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button type="button" onClick={addSelectionToPool} className="w-full bg-emerald-600 py-2 rounded-lg font-bold text-xs text-white shadow-md active:scale-95">AÑADIR {diceCount} {selectedDie.toUpperCase()}</button>
            </div>
          )}

          {/* RESERVA DE DADOS */}
          {dicePool.length > 0 && (
            <div className="p-2 bg-neutral-100 dark:bg-emerald-900/10">
              <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[9px] uppercase text-emerald-600 font-bold">Reserva</span>
                <button type="button" onClick={() => setDicePool([])} className="text-red-500 hover:text-red-600"><Trash2 size={12} /></button>
              </div>
              <div className="flex flex-wrap gap-1 mb-2 max-h-24 overflow-y-auto custom-scrollbar">
                {dicePool.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 bg-white dark:bg-black/60 px-2 py-1 rounded text-[10px] border border-neutral-200 dark:border-white/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full border border-black/5" style={{ backgroundColor: item.color }}></span>
                    <span className="font-bold text-neutral-800 dark:text-white">{item.qty}{item.sides}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={triggerRoll} className="w-full bg-emerald-600 py-3 rounded-xl font-bold text-sm text-white shadow-lg active:scale-95 flex justify-center items-center gap-2">
                <Dices size={18} /> LANZAR {modifier != 0 && (modifier > 0 ? `+${modifier}` : modifier)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DiceConsole;