import { Dices, ChevronUp, ChevronDown, ScrollText } from 'lucide-react';

function Footer({ isOpen, setIsOpen, onToggleConsole, isConsoleOpen, onToggleHistory, isHistoryOpen }) {
  return (
    <>
      <footer 
        className={`
          fixed bottom-0 left-0 w-full z-[100] 
          transition-transform duration-500 ease-in-out
          ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'} 
          pb-[env(safe-area-inset-bottom)]
        `}
      >
        {/* FONDO Y CONTENIDO */}
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 h-14 px-4 flex justify-between items-center gap-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
          
          <div className="w-4"></div> {/* Espaciador */}

          {/* BOTONERA CENTRAL */}
          <div className="flex gap-4">
            <button onClick={(e) => { e.preventDefault(); onToggleConsole(); }} className="group h-10 flex items-center outline-none">
              <div className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border pointer-events-none ${isConsoleOpen ? 'bg-emerald-600 text-white shadow-lg border-emerald-500' : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-transparent'}`}>
                <Dices size={18} /> <span className="text-[10px] font-bold uppercase">Tirador</span>
              </div>
            </button>

            <button onClick={(e) => { e.preventDefault(); onToggleHistory(); }} className="group h-10 flex items-center outline-none">
              <div className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border pointer-events-none ${isHistoryOpen ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-transparent'}`}>
                <ScrollText size={18} /> <span className="text-[10px] font-bold uppercase">Historial</span>
              </div>
            </button>
          </div>

          {/* BOTÓN COLAPSAR (Dentro del footer) */}
          <div className="w-4 flex justify-end">
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-red-500 transition-colors p-2">
              <ChevronDown size={20} />
            </button>
          </div>
        </div>
      </footer>

      {/* BOTÓN ABRIR (Solo visible cuando está cerrado) */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 ${!isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}>
        <button 
          onClick={() => setIsOpen(true)} 
          className="bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform"
        >
          <ChevronUp size={24} />
        </button>
      </div>
    </>
  );
}

export default Footer;