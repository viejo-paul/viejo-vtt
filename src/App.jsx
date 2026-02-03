import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Eraser, ImageOff, RotateCcw } from 'lucide-react'; // Nuevos iconos

import DiceConsole from './modules/DiceConsole';
import RollHistory from './modules/RollHistory';
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

  const handleUploadBackground = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBackgroundImage(reader.result);
      reader.readAsDataURL(file);
    }
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
      
      {/* 1. CAPA DE FONDO (MAPA) MEJORADA */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
            // Estos filtros ayudan a que la imagen se vea más nítida en Chrome/Edge
            imageRendering: ' -webkit-optimize-contrast',
          }}
        >
          {/* Capa oscura (Overlay) */}
          <div className="absolute inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-[0px]"></div>
        </div>
      )}

      {/* DADOS */}
      <div id="dice-canvas" className="absolute inset-0 z-10 w-screen h-screen pointer-events-none block"></div>

      <Header isOpen={headerOpen} setIsOpen={setHeaderOpen} onUploadBackground={handleUploadBackground} />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-black/50 p-2 rounded-full hover:bg-emerald-600 hover:text-white transition border border-neutral-300 dark:border-white/10 shadow-lg"><ChevronDown size={16} /></button>
      )}

      {/* BOTONERA LATERAL (Eraser, NoMap, ResetUI) */}
      <div className="absolute top-20 right-6 z-20 flex flex-col gap-3">
        {/* 1. LIMPIAR DADOS */}
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl" title="Limpiar Tablero">
          <Eraser size={20} />
        </button>

        {/* 2. QUITAR MAPA (Solo si hay mapa) */}
        {backgroundImage && (
          <button onClick={() => setBackgroundImage(null)} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-orange-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl" title="Quitar Fondo">
            <ImageOff size={20} />
          </button>
        )}

        {/* 3. RESET UI (El salvavidas) */}
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }} 
          className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group"
          title="Resetear Interfaz"
        >
          <RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={historyLogs} onClose={() => setShowHistory(false)} onClear={() => setHistoryLogs([])} />}

      <Footer isOpen={footerOpen} setIsOpen={setFooterOpen} onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory} />
    </div>
  );
}

export default App;