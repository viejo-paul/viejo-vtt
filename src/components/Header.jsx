import { Sun, Moon, Map, ChevronUp } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect } from 'react';

function Header({ isOpen, setIsOpen, onUploadBackground }) {
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
    <header className={`
      absolute top-0 left-0 w-full z-50 transition-transform duration-500 
      ${isOpen ? 'translate-y-0' : '-translate-y-full'}
    `}>
      <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md border-b border-black/10 dark:border-white/10 px-4 py-2 flex justify-between items-center h-16 shadow-lg">
        
        {/* TÍTULO */}
        <h1 className="text-emerald-600 dark:text-emerald-500 font-black tracking-widest uppercase text-sm md:text-base">
          Viejo VTT
        </h1>
        
        {/* CONTROLES (Agrupados con gap fijo para evitar colapsos) */}
        <div className="flex items-center gap-3">
          
          {/* 1. Subir Mapa */}
          <label className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-400 cursor-pointer transition-all active:scale-95" title="Cambiar Fondo">
            <Map size={20} />
            <input type="file" accept="image/*" className="hidden" onChange={onUploadBackground} />
          </label>

          {/* 2. Tema */}
          <button onClick={toggleTheme} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-all active:scale-95">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* 3. CERRAR HEADER (Con borde y fondo para máxima visibilidad) */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all shadow-sm ml-2"
            title="Ocultar Menú"
          >
            <ChevronUp size={22} strokeWidth={3} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;