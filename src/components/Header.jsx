import { Sun, Moon, ChevronUp } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useEffect } from 'react';

function Header({ isOpen, setIsOpen }) {
  // Usamos nuestro hook de persistencia para recordar el tema
  const [theme, setTheme] = usePersistentState('vtt-theme', 'dark');

  // Aplicamos o quitamos la clase 'dark' al HTML cada vez que cambie el tema
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
      <div className="bg-white/80 dark:bg-black/60 backdrop-blur-md border-b border-black/10 dark:border-white/10 p-4 flex justify-between items-center h-14 transition-colors duration-300">
        <h1 className="text-emerald-600 dark:text-emerald-500 font-bold tracking-widest uppercase text-sm">Viejo VTT</h1>
        
        <div className="flex items-center gap-4">
          {/* BOTÓN MODO OSCURO / CLARO */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-neutral-600 dark:text-yellow-400 transition-colors"
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* BOTÓN COLAPSAR */}
          <button 
            onClick={() => setIsOpen(false)} 
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition text-neutral-500"
          >
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;