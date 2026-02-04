import { Sun, Moon, Map, ChevronDown, Copy, Check, User } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect, useState } from 'react';

function Header({ isOpen, setIsOpen, onOpenBackgroundModal, roomData, userProfile }) {
  const [theme, setTheme] = usePersistentState('vtt-theme', 'dark');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className={`absolute top-0 left-0 w-full z-50 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-y-0' : '-translate-y-[120%]'}`}>
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 flex justify-between items-center h-16 shadow-lg">
          
          {/* INFO SALA Y USUARIO */}
          <div className="flex flex-col items-start overflow-hidden">
            {roomData ? (
              <>
                <div onClick={copyLink} className="flex items-center gap-2 cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 -ml-2 rounded-lg transition-colors">
                  <h1 className="text-emerald-600 dark:text-emerald-500 font-black uppercase text-sm md:text-base truncate max-w-[150px] sm:max-w-xs">
                    {roomData.title}
                  </h1>
                  {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={12} className="text-neutral-400 group-hover:text-emerald-500" />}
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono mt-0.5">
                   {/* USUARIO ACTUAL */}
                   {userProfile && (
                     <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-neutral-800 dark:text-white">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: userProfile.color }}></div>
                        <span className="font-bold truncate max-w-[80px]">{userProfile.name}</span>
                     </div>
                   )}
                   <span className="opacity-50">|</span>
                   <span>#{roomData.code}</span>
                   {roomData.isGM && <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1 rounded font-bold ml-1">DJ</span>}
                </div>
              </>
            ) : (
               <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-widest uppercase text-sm">Viejo VTT</h1>
            )}
          </div>
          
          {/* CONTROLES */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onOpenBackgroundModal} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-all active:scale-95" title="Cambiar Fondo"><Map size={18} /></button>
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-all active:scale-95">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            
            {/* Botón cerrar integrado estilo footer */}
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-red-500 transition-colors p-1 ml-2"><ChevronDown size={20} className="rotate-180" /></button>
          </div>
        </div>
      </header>

      {/* BOTÓN FLOTANTE PARA ABRIR (Igual que el footer pero arriba) */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-500 ${!isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}`}>
        <button onClick={() => setIsOpen(true)} className="bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform">
          <ChevronDown size={24} />
        </button>
      </div>
    </>
  );
}

export default Header;