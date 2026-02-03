import { Dices, ChevronUp, ChevronDown, ScrollText } from 'lucide-react';

function Footer({ isOpen, setIsOpen, onToggleConsole, isConsoleOpen, onToggleHistory, isHistoryOpen }) {
  return (
    <>
      <footer 
        className={`
          fixed bottom-0 left-0 w-full z-[100] transition-transform duration-500
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          pb-[env(safe-area-inset-bottom)] /* Esto es vital para iPhone/Android modernos */
        `}
      >
        {/* CAMBIO: bg-white/80 para modo claro y dark:bg-black/60 para oscuro. 
            También ajustamos el borde a dark:border-white/10 */}
        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border-t border-black/5 dark:border-white/10 h-14 px-4 flex justify-between items-center gap-4 transition-colors duration-300"></div>
          
          <div className="w-4"></div>

          {/* BOTONERA CENTRAL */}
          <div className="flex gap-4">
            {/* Botón TIRADOR */}
            <button 
              onClick={onToggleConsole}
              className="group h-10 flex items-center"
            >
              <div className={`
                px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 border
                ${isConsoleOpen 
                  ? 'bg-emerald-600 text-white shadow-lg border-emerald-500' 
                  : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 hover:bg-emerald-600/20 hover:text-emerald-700 dark:hover:text-white border-transparent hover:border-emerald-500/30'}
              `}>
                <Dices size={18} />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Tirador
                </span>
              </div>
            </button>

            {/* Botón HISTORIAL en Footer.jsx */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                onToggleHistory();
              }}
              className="group h-10 flex items-center outline-none" // Añadimos outline-none para evitar marcos feos
            >
              <div className={`
                px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 border pointer-events-none
                ${isHistoryOpen 
                  ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' 
                  : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 hover:bg-indigo-600/20 hover:text-indigo-700 dark:hover:text-white border-transparent hover:border-indigo-500/30'}
              `}>
                <ScrollText size={18} />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  Historial
                </span>
              </div>
            </button>

          {/* Botón Colapsar */}
          <div className="w-4 flex justify-end">
            <button 
              onClick={() => setIsOpen(true)} 
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] ... shadow-2xl"
            >
              <ChevronUp size={24} /> {/* Hazlo un poco más grande para dedos */}
            </button>
          </div>
        </div>
      </footer>

      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 bg-white/80 dark:bg-black/50 p-2 rounded-full hover:bg-emerald-600 hover:text-white transition shadow-lg border border-black/10 dark:border-white/10"
        >
          <ChevronUp size={16} className="text-neutral-600 dark:text-white" />
        </button>
      )}
    </>
  );
}

export default Footer;