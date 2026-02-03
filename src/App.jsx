import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Eraser } from 'lucide-react'; 

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

  // SINCRONIZACIÓN SEGURA
  useEffect(() => {
    if (diceReady) {
      try {
        DiceManager.updateTheme(theme);
      } catch (e) {
        console.warn("No se pudo actualizar el tema 3D");
      }
    }
  }, [theme, diceReady]);

  const handleConsoleRoll = async (rollConfig) => {
    const results = await DiceManager.roll(rollConfig);
    if (results.length > 0) {
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        results: results.map(r => ({ value: r.value, sides: r.sides, color: r.themeColor }))
      };
      setHistoryLogs(prev => [newLog, ...prev]);
      setShowHistory(true);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden select-none">
      <div id="dice-canvas" className="absolute inset-0 z-10 w-screen h-screen pointer-events-none block"></div>
      <Header isOpen={headerOpen} setIsOpen={setHeaderOpen} />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-black/50 p-2 rounded-full hover:bg-emerald-600 transition border border-neutral-300 dark:border-white/10 shadow-lg"><ChevronDown size={16} /></button>
      )}

      <button onClick={() => DiceManager.clear()} className="absolute top-20 right-6 z-20 bg-white dark:bg-neutral-900/50 backdrop-blur-sm p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group"><Eraser size={20} /></button>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={historyLogs} onClose={() => setShowHistory(false)} onClear={() => setHistoryLogs([])} />}

      <Footer isOpen={footerOpen} setIsOpen={setFooterOpen} onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory} />
    </div>
  );
}

export default App;