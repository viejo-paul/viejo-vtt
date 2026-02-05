import { ChevronDown, ChevronUp, Dices, ScrollText, Library, Music } from 'lucide-react';

function Footer({ isOpen, setIsOpen, onToggleConsole, isConsoleOpen, onToggleHistory, isHistoryOpen, onOpenLibrary, onOpenMusic }) {
  
  const FooterButton = ({ active, onClick, icon: Icon, label, colorClass, borderClass }) => (
    <button 
      onClick={(e) => { 
        e.preventDefault(); 
        e.stopPropagation(); 
        if(onClick) onClick(); 
      }} 
      className="group h-10 flex items-center outline-none"
    >
      <div className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border cursor-pointer select-none ${active ? `${colorClass} text-white shadow-lg ${borderClass}` : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-transparent hover:bg-black/10 dark:hover:bg-white/10'}`}>
        <Icon size={18} /> <span className="text-[10px] font-bold uppercase hidden sm:inline">{label}</span>
      </div>
    </button>
  );

  return (
    <>
      <footer className={`fixed bottom-0 left-0 w-full z-[100] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-[120%]'} pb-[env(safe-area-inset-bottom)]`}>
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-t border-black/10 dark:border-white/10 h-16 px-4 flex justify-between items-center gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
          <div className="w-8"></div> 

          <div className="flex gap-2 sm:gap-4">
            {/* 1. TIRADOR DE DADOS */}
            <FooterButton active={isConsoleOpen} onClick={onToggleConsole} icon={Dices} label="Tirador" colorClass="bg-emerald-600" borderClass="border-emerald-500" />
            
            {/* 2. BIBLIOTECA (Unifica Notas y Handouts) */}
            <FooterButton active={false} onClick={onOpenLibrary} icon={Library} label="Biblioteca" colorClass="bg-amber-600" borderClass="border-amber-500" />
            
            {/* 3. MÚSICA (Oculta por ahora) */}
            {/* <FooterButton active={false} onClick={onOpenMusic} icon={Music} label="Música" colorClass="bg-violet-600" borderClass="border-violet-500" /> */}
            
            {/* 4. HISTORIAL */}
            <FooterButton active={isHistoryOpen} onClick={onToggleHistory} icon={ScrollText} label="Historial" colorClass="bg-indigo-600" borderClass="border-indigo-500" />
          </div>

          <div className="w-8 flex justify-end">
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-red-500 transition-colors p-2"><ChevronDown size={20} /></button>
          </div>
        </div>
      </footer>

      {/* Pestaña Abrir Footer (Círculo Pequeño) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] w-8 h-8 rounded-full bg-neutral-900/90 text-neutral-500 hover:text-white flex items-center justify-center backdrop-blur shadow-lg border border-white/10 transition-all hover:scale-110"
        >
          <ChevronUp size={16} />
        </button>
      )}
    </>
  );
}

export default Footer;