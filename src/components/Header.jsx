import { Sun, Moon, Map, ChevronUp } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect } from 'react';

function Header({ isOpen, setIsOpen, onOpenBackgroundModal }) { // Cambiamos prop
  const [theme, setTheme] = usePersistentState('vtt-theme', 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className={`absolute top-0 left-0 w-full z-50 transition-transform duration-500 ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-2 flex justify-between items-center h-16 shadow-lg">
        <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-widest uppercase text-sm md:text-base">Viejo VTT</h1>
        <div className="flex items-center gap-3">
          
          {/* BOTÓN MAPA: Ahora llama a la función para abrir el modal */}
          <button onClick={onOpenBackgroundModal} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 transition-all active:scale-95" title="Cambiar Fondo">
            <Map size={20} />
          </button>

          <button onClick={toggleTheme} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-all active:scale-95">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button onClick={() => setIsOpen(false)} className="flex items-center justify-center w-10 h-10 bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform shadow-sm ml-2">
            <ChevronUp size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </header>
  );
}
export default Header;