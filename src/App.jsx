import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Eraser, ImageOff, RotateCcw } from 'lucide-react'; 

import DiceConsole from './modules/DiceConsole';
import RollHistory from './modules/RollHistory';
import ImageWindow from './modules/ImageWindow';
import ResourceModal from './components/ResourceModal';
import Footer from './components/Footer';
import Header from './components/Header';
import { usePersistentState } from './hooks/usePersistentState';
import { DiceManager } from './engine/DiceManager'; 

function App() {
  const [headerOpen, setHeaderOpen] = usePersistentState('vtt-header-open', true);
  const [footerOpen, setFooterOpen] = usePersistentState('vtt-footer-open', true);
  const [showConsole, setShowConsole] = usePersistentState('vtt-show-console', false);
  const [showHistory, setShowHistory] = usePersistentState('vtt-show-history', false);
  const [historyLogs, setHistoryLogs] = usePersistentState('vtt-logs', []);
  const [theme] = usePersistentState('vtt-theme', 'dark');
  const [backgroundImage, setBackgroundImage] = usePersistentState('vtt-bg-image', null);
  
  // GESTIÓN DE MÚLTIPLES VENTANAS
  const [activeModal, setActiveModal] = useState(null); 
  const [activeHandouts, setActiveHandouts] = usePersistentState('vtt-active-handouts', []);

  const [diceReady, setDiceReady] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    DiceManager.init('#dice-canvas').then(() => {
      setDiceReady(true);
      setTimeout(() => DiceManager.resize(), 200);
    });
    const handleResize = () => DiceManager.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (diceReady) {
      try { DiceManager.updateTheme(theme); } catch (e) { console.warn("Update theme failed"); }
    }
  }, [theme, diceReady]);

  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') {
      setBackgroundImage(data.src);
    } else if (activeModal === 'handout') {
      // AÑADIMOS UNA NUEVA VENTANA AL ARRAY
      const newHandout = {
        id: Date.now(), // ID único
        contentType: data.contentType, // 'pdf' o 'image'
        src: data.src,
        title: data.title
      };
      setActiveHandouts(prev => [...prev, newHandout]);
    }
    setActiveModal(null);
  };

  // Función para cerrar una ventana específica
  const closeHandout = (id) => {
    setActiveHandouts(prev => prev.filter(h => h.id !== id));
  };

  const handleConsoleRoll = async (rollConfig, modifier = 0) => {
    const results = await DiceManager.roll(rollConfig);
    if (results.length > 0) {
      const naturalTotal = results.reduce((acc, r) => acc + r.value, 0);
      const modVal = parseInt(modifier) || 0;
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modifier: modVal,
        total: naturalTotal + modVal,
        results: results.map(r => ({ value: r.value, sides: r.sides, color: r.themeColor }))
      };
      setHistoryLogs(prev => [newLog, ...prev]);
      setShowHistory(true);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden select-none">
      
      {/* FONDO */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500" style={{ backgroundImage: `url(${backgroundImage})`, imageRendering: '-webkit-optimize-contrast' }}>
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[0px]"></div>
        </div>
      )}

      {/* DADOS */}
      <div id="dice-canvas" className="absolute inset-0 z-10 w-screen h-screen pointer-events-none block"></div>

      <Header isOpen={headerOpen} setIsOpen={setHeaderOpen} onOpenBackgroundModal={() => setActiveModal('background')} />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-black/50 p-2 rounded-full hover:bg-emerald-600 hover:text-white transition border border-neutral-300 dark:border-white/10 shadow-lg"><ChevronDown size={16} /></button>
      )}

      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl" title="Limpiar Tablero"><Eraser size={20} /></button>
        {backgroundImage && (
          <button onClick={() => setBackgroundImage(null)} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-orange-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl" title="Quitar Fondo"><ImageOff size={20} /></button>
        )}
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group" title="Resetear Interfaz"><RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" /></button>
      </div>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={historyLogs} onClose={() => setShowHistory(false)} onClear={() => setHistoryLogs([])} />}
      
      {/* RENDERIZAMOS TODAS LAS VENTANAS ACUMULADAS */}
      {activeHandouts.map((handout) => (
        <ImageWindow 
          key={handout.id} 
          id={handout.id} 
          data={handout} 
          onClose={() => closeHandout(handout.id)} 
        />
      ))}

      <ResourceModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleResourceSubmit} 
        title={activeModal === 'background' ? "Configurar Fondo" : "Nueva Ayuda de Juego"}
        showTitleInput={activeModal === 'handout'}
      />

      <Footer 
        isOpen={footerOpen} 
        setIsOpen={setFooterOpen} 
        onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} 
        onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory}
        onOpenImageModal={() => setActiveModal('handout')} 
      />
    </div>
  );
}

export default App;