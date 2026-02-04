import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, HashRouter } from 'react-router-dom'; // Router
import { ChevronDown, Eraser, ImageOff, RotateCcw } from 'lucide-react'; 

// Importaciones
import DiceConsole from './modules/DiceConsole';
import RollHistory from './modules/RollHistory';
import ImageWindow from './modules/ImageWindow';
import ResourceModal from './components/ResourceModal';
import Footer from './components/Footer';
import Header from './components/Header';
import { LobbyModal } from './modules/LobbyModals';     // <--- NUEVO
import { IdentityModal } from './modules/IdentityModal'; // <--- NUEVO
import { usePersistentState } from './hooks/usePersistentState';
import { DiceManager } from './engine/DiceManager'; 

// ==========================================
// COMPONENTE PRINCIPAL (RUTAS)
// ==========================================
function App() {
  return (
    <HashRouter> {/* Usamos HashRouter para evitar líos con Firebase Hosting y rutas */}
      <div className="fixed inset-0 w-screen h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden select-none">
        
        {/* EL MOTOR 3D SIEMPRE DE FONDO */}
        <div id="dice-canvas" className="absolute inset-0 z-10 w-screen h-screen pointer-events-none block"></div>
        
        {/* RUTAS */}
        <Routes>
          <Route path="/" element={<GameLayout />} />
          <Route path="/room/:slug" element={<GameLayout />} />
        </Routes>

      </div>
    </HashRouter>
  );
}

// ==========================================
// LAYOUT DEL JUEGO (LÓGICA)
// ==========================================
function GameLayout() {
  const { slug } = useParams(); // ID de la sala desde URL
  const location = useLocation(); // Datos pasados al crear (título, code)
  
  // DATOS DE SESIÓN Y USUARIO
  const [userProfile, setUserProfile] = usePersistentState('vtt-user-profile', null);
  const [roomData, setRoomData] = useState(null);

  // ESTADOS DE UI (Igual que antes)
  const [headerOpen, setHeaderOpen] = usePersistentState('vtt-header-open', true);
  const [footerOpen, setFooterOpen] = usePersistentState('vtt-footer-open', true);
  const [showConsole, setShowConsole] = usePersistentState('vtt-show-console', false);
  const [showHistory, setShowHistory] = usePersistentState('vtt-show-history', false);
  const [historyLogs, setHistoryLogs] = usePersistentState('vtt-logs', []);
  const [theme] = usePersistentState('vtt-theme', 'dark');
  const [backgroundImage, setBackgroundImage] = usePersistentState('vtt-bg-image', null);
  const [activeHandouts, setActiveHandouts] = usePersistentState('vtt-active-handouts', []);
  
  // MODALES
  const [activeModal, setActiveModal] = useState(null); 
  const [diceReady, setDiceReady] = useState(false);
  const initialized = useRef(false);

  // 1. INICIALIZAR DADOS (Solo una vez)
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

  // 2. CONFIGURAR SALA (Si hay slug)
  useEffect(() => {
    if (slug) {
      // Intentamos recuperar datos del state de navegación o generarlos básicos
      // Mañana aquí leeremos de Firebase
      const title = location.state?.roomTitle || slug.split('-')[0].toUpperCase();
      const code = location.state?.roomCode || slug.split('-').pop();
      const isGM = location.state?.isGM || false;
      setRoomData({ title, code, slug, isGM });
    } else {
      setRoomData(null); // Estamos en el Lobby
    }
  }, [slug, location.state]);

  // 3. TEMA 3D
  useEffect(() => {
    if (diceReady) try { DiceManager.updateTheme(theme); } catch (e) {}
  }, [theme, diceReady]);


  // --- MANEJADORES ---

  const handleConsoleRoll = async (rollConfig, modifier = 0) => {
    const results = await DiceManager.roll(rollConfig);
    if (results.length > 0) {
      const naturalTotal = results.reduce((acc, r) => acc + r.value, 0);
      const modVal = parseInt(modifier) || 0;
      
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: userProfile, // <--- AÑADIMOS QUIÉN TIRÓ
        modifier: modVal,
        total: naturalTotal + modVal,
        results: results.map(r => ({ value: r.value, sides: r.sides, color: r.themeColor }))
      };
      setHistoryLogs(prev => [newLog, ...prev]);
      setShowHistory(true);
    }
  };

  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') {
      setBackgroundImage(data.src);
    } else if (activeModal === 'handout') {
      setActiveHandouts(prev => [...prev, { id: Date.now(), ...data }]);
    }
    setActiveModal(null);
  };

  // --- RENDERIZADO CONDICIONAL ---

  // CASO 1: ESTAMOS EN LA RAÍZ (NO HAY SALA) -> MOSTRAR LOBBY
  if (!slug) {
    return (
      <>
        {/* Fondo decorativo (mapa suave si hay, sino nada) */}
        {backgroundImage && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${backgroundImage})` }} />}
        <LobbyModal />
      </>
    );
  }

  // CASO 2: HAY SALA PERO NO TENEMOS IDENTIDAD -> MOSTRAR MODAL NOMBRE
  if (!userProfile) {
    return <IdentityModal onComplete={setUserProfile} />;
  }

  // CASO 3: JUEGO COMPLETO
  return (
    <>
      {/* FONDO */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500" style={{ backgroundImage: `url(${backgroundImage})`, imageRendering: '-webkit-optimize-contrast' }}>
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[0px]"></div>
        </div>
      )}

      {/* COMPONENTES DE UI */}
      
      {/* HEADER: Ahora le pasamos la info de la sala */}
      <Header 
        isOpen={headerOpen} 
        setIsOpen={setHeaderOpen} 
        onOpenBackgroundModal={() => setActiveModal('background')}
        roomData={roomData} // <--- NUEVA PROP
      />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-black/50 p-2 rounded-full hover:bg-emerald-600 hover:text-white transition border border-neutral-300 dark:border-white/10 shadow-lg"><ChevronDown size={16} /></button>
      )}

      {/* BOTONERA DERECHA */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><Eraser size={20} /></button>
        {backgroundImage && <button onClick={() => setBackgroundImage(null)} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-orange-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><ImageOff size={20} /></button>}
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group"><RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" /></button>
      </div>

      {/* VENTANAS FLOTANTES */}
      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={historyLogs} onClose={() => setShowHistory(false)} onClear={() => setHistoryLogs([])} />}
      {activeHandouts.map(h => <ImageWindow key={h.id} id={h.id} data={h} onClose={() => setActiveHandouts(p => p.filter(x => x.id !== h.id))} />)}

      <ResourceModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleResourceSubmit} 
        title={activeModal === 'background' ? "Configurar Fondo" : "Nueva Ayuda"}
        showTitleInput={activeModal === 'handout'}
      />

      <Footer 
        isOpen={footerOpen} setIsOpen={setFooterOpen} 
        onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} 
        onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory}
        onOpenImageModal={() => setActiveModal('handout')} 
      />
    </>
  );
}

export default App;