import { ChevronDown, ChevronUp, Dices, ScrollText, Image as ImageIcon, StickyNote } from 'lucide-react'; // Importamos StickyNote

function Footer({ isOpen, setIsOpen, onToggleConsole, isConsoleOpen, onToggleHistory, isHistoryOpen, onOpenImageModal, onOpenNotes }) { // Nuevo prop onOpenNotes
  
  const FooterButton = ({ active, onClick, icon: Icon, label, colorClass, borderClass }) => (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} className="group h-10 flex items-center outline-none">
      <div className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 border pointer-events-none ${active ? `${colorClass} text-white shadow-lg ${borderClass}` : 'bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-transparent hover:bg-black/10 dark:hover:bg-white/10'}`}>
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
            <FooterButton active={isConsoleOpen} onClick={onToggleConsole} icon={Dices} label="Tirador" colorClass="bg-emerald-600" borderClass="border-emerald-500" />
            <FooterButton active={false} onClick={onOpenImageModal} icon={ImageIcon} label="Handout" colorClass="bg-pink-600" borderClass="border-pink-500" />
            
            {/* NUEVO BOTÓN NOTAS */}
            <FooterButton active={false} onClick={onOpenNotes} icon={StickyNote} label="Notas" colorClass="bg-yellow-500" borderClass="border-yellow-600" />
            
            <FooterButton active={isHistoryOpen} onClick={onToggleHistory} icon={ScrollText} label="Historial" colorClass="bg-indigo-600" borderClass="border-indigo-500" />
          </div>

          <div className="w-8 flex justify-end">
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-red-500 transition-colors p-2"><ChevronDown size={20} /></button>
          </div>
        </div>
      </footer>

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 ${!isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}>
        <button onClick={() => setIsOpen(true)} className="bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform"><ChevronUp size={24} /></button>
      </div>
    </>
  );
}

export default Footer;