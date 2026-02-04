import { Sun, Moon, Map, ChevronUp, Copy, Check } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect, useState } from 'react';

function Header({ isOpen, setIsOpen, onOpenBackgroundModal, roomData }) { // Nueva prop roomData
  const [theme, setTheme] = usePersistentState('vtt-theme', 'dark');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const copyLink = () => {
    // Copiamos la URL actual
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className={`absolute top-0 left-0 w-full z-50 transition-transform duration-500 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-2 flex justify-between items-center h-16 shadow-lg">
        
        {/* INFO DE LA SALA */}
        <div className="flex flex-col">
          {roomData ? (
            <>
              <div className="flex items-center gap-2 group cursor-pointer" onClick={copyLink}>
                <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-wide uppercase text-sm md:text-base hover:underline truncate max-w-[200px]">
                  {roomData.title}
                </h1>
                {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={12} className="text-neutral-400 group-hover:text-emerald-500" />}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                <span>#{roomData.code}</span>
                {roomData.isGM && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1 rounded font-bold">DJ</span>}
              </div>
            </>
          ) : (
             <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-widest uppercase text-sm">Viejo VTT</h1>
          )}
        </div>
        
        {/* CONTROLES DERECHA (Igual que antes) */}
        <div className="flex items-center gap-3">
          <button onClick={onOpenBackgroundModal} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-all active:scale-95" title="Cambiar Fondo"><Map size={20} /></button>
          <button onClick={toggleTheme} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-all active:scale-95">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <button onClick={() => setIsOpen(false)} className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all shadow-sm ml-2"><ChevronUp size={22} strokeWidth={3} /></button>
        </div>
      </div>
    </header>
  );
}

export default Header;