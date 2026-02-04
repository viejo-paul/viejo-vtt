import { Sun, Moon, Map, ChevronDown, Copy, Check, LogOut, User } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect, useState } from 'react';

function Header({ isOpen, setIsOpen, onOpenBackgroundModal, roomData, userProfile, connectedPlayers, onExit }) {
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
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-2 flex justify-between items-center min-h-[64px] shadow-lg">
          
          {/* BLOQUE IZQUIERDO: INFO SALA */}
          <div className="flex flex-col items-start gap-1">
            {roomData ? (
              <>
                {/* LÍNEA 1: Título + Código + Copiar */}
                <div onClick={copyLink} className="flex items-center gap-2 cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 px-2 py-1 -ml-2 rounded-lg transition-colors">
                  <h1 className="text-emerald-600 dark:text-emerald-500 font-black uppercase text-sm md:text-base truncate max-w-[150px] sm:max-w-xs">
                    {roomData.title}
                  </h1>
                  <span className="text-neutral-400 text-xs font-mono">#{roomData.code}</span>
                  {copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={12} className="text-neutral-400 group-hover:text-emerald-500" />}
                </div>
                
                {/* LÍNEA 2: Jugadores Conectados */}
                <div className="flex items-center gap-1.5 pl-1">
                   {connectedPlayers && connectedPlayers.map((player, idx) => (
                     <div key={idx} className="group relative">
                        <div 
                          className={`w-6 h-6 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm flex items-center justify-center text-[10px] font-bold text-white ${player.isGM ? 'ring-2 ring-yellow-400 z-10' : ''}`}
                          style={{ backgroundColor: player.color }}
                          title={player.name}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        {/* Tooltip nombre */}
                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 bg-black/80 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {player.name}
                        </span>
                     </div>
                   ))}
                   {/* Si estoy yo solo, texto de ayuda */}
                   {connectedPlayers && connectedPlayers.length === 1 && (
                     <span className="text-[10px] text-neutral-400 italic ml-1">Esperando jugadores...</span>
                   )}
                </div>
              </>
            ) : (
               <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-widest uppercase text-sm">Viejo VTT</h1>
            )}
          </div>
          
          {/* BLOQUE DERECHO: CONTROLES */}
          <div className="flex items-center gap-3">
            
            <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-all active:scale-95">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            
            <div className="w-px h-6 bg-neutral-300 dark:bg-white/10 mx-1"></div>

            {/* BOTÓN SALIR */}
            <button onClick={onExit} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-all active:scale-95" title="Salir de la Sala">
              <LogOut size={18} />
            </button>

            {/* Botón colapsar (interno) */}
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-emerald-500 transition-colors p-1 ml-1">
              <ChevronDown size={20} className="rotate-180" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;