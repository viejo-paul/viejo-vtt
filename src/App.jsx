import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, HashRouter } from 'react-router-dom';
import { ChevronDown, Eraser, ImageOff, RotateCcw } from 'lucide-react';
import { useRoomSync } from './hooks/useRoomSync'; 

// Importaciones
import DiceConsole from './modules/DiceConsole';
import RollHistory from './modules/RollHistory';
import ImageWindow from './modules/ImageWindow';
import ResourceModal from './components/ResourceModal';
import Footer from './components/Footer';
import Header from './components/Header';
import { LobbyModal } from './modules/LobbyModals';
import { IdentityModal } from './modules/IdentityModal';
import { usePersistentState } from './hooks/usePersistentState';
import { DiceManager } from './engine/DiceManager'; 

function App() {
  // Fix tema inicial
  useEffect(() => {
    const savedTheme = localStorage.getItem('vtt-theme');
    if (savedTheme === '"dark"') document.documentElement.classList.add('dark');
  }, []);

  return (
    <HashRouter>
      <div className="fixed inset-0 w-screen h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-colors duration-500 overflow-hidden select-none">
        <div id="dice-canvas" className="absolute inset-0 z-10 w-screen h-screen pointer-events-none block"></div>
        <Routes>
          <Route path="/" element={<GameLayout />} />
          <Route path="/room/:slug" element={<GameLayout />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

function GameLayout() {
  const { slug } = useParams();
  const location = useLocation(); 
  const navigate = useNavigate(); // Para el botón salir
  
  // GENERAR ID DE SESIÓN ÚNICO (Para evitar doble roll)
  // useRef mantiene el valor entre renderizados sin provocar re-render
  const mySessionId = useRef(Math.random().toString(36).substr(2, 9));

  // DATOS
  const [userProfile, setUserProfile] = usePersistentState('vtt-user-profile', null);
  const [roomData, setRoomData] = useState(null);

  // UI STATES (Scopes por sala)
  const scope = slug || 'lobby';
  const [headerOpen, setHeaderOpen] = usePersistentState(`vtt-${scope}-header-open`, true);
  const [footerOpen, setFooterOpen] = usePersistentState(`vtt-${scope}-footer-open`, true);
  const [showConsole, setShowConsole] = usePersistentState(`vtt-${scope}-show-console`, false);
  const [showHistory, setShowHistory] = usePersistentState(`vtt-${scope}-show-history`, false);
  const [theme] = usePersistentState('vtt-theme', 'dark');
  
  // SYNC
  const { 
    remoteLogs, remoteBg, remoteHandouts, connectedPlayers, // <--- Recibimos jugadores
    emitLog, emitBackground, emitHandout, removeHandout 
  } = useRoomSync(slug, userProfile);
  
  const [activeModal, setActiveModal] = useState(null); 
  const [diceReady, setDiceReady] = useState(false);
  const initialized = useRef(false);

  // Inicialización 3D
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    DiceManager.init('#dice-canvas').then(() => {
      setDiceReady(true);
      setTimeout(() => { DiceManager.resize(); DiceManager.updateTheme(theme); }, 200);
    });
    const handleResize = () => DiceManager.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { if (diceReady) try { DiceManager.updateTheme(theme); } catch(e){} }, [theme, diceReady]);

  // --- FIX DOBLE ROLL ---
  const lastProcessedLogId = useRef(0);

  useEffect(() => {
    if (remoteLogs.length > 0) {
      const latestLog = remoteLogs[0];
      
      if (latestLog.id > lastProcessedLogId.current) {
        const isFresh = (Date.now() - latestLog.id) < 5000;
        
        // AQUÍ ESTÁ EL TRUCO:
        // Si el log tiene MI sessionId, NO lo ruedo (porque ya lo rodé localmente)
        const isMyRoll = latestLog.sessionId === mySessionId.current;

        if (isFresh && !isMyRoll) {
          const rollConfig = latestLog.results.map(r => ({
             sides: parseInt(r.sides), qty: 1, themeColor: r.color
          }));
          DiceManager.roll(rollConfig);
        }
        lastProcessedLogId.current = latestLog.id;
      }
    }
  }, [remoteLogs]);

  // --- MANEJADOR DE ROLL ---
  const handleConsoleRoll = async (rollConfig, modifier = 0) => {
    // 1. Rodamos local (inmediato)
    const results = await DiceManager.roll(rollConfig);
    
    if (results.length > 0) {
      const naturalTotal = results.reduce((acc, r) => acc + r.value, 0);
      const modVal = parseInt(modifier) || 0;
      
      const newLog = {
        id: Date.now(),
        sessionId: mySessionId.current, // <--- ENVIAMOS NUESTRA FIRMA
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modifier: modVal,
        total: naturalTotal + modVal,
        results: results.map(r => ({ value: r.value, sides: r.sides, color: r.themeColor }))
      };
      
      if (slug) emitLog(newLog);
      setShowHistory(true);
    }
  };

  // Configuración Sala
  useEffect(() => {
    if (slug) {
      const title = location.state?.roomTitle || slug.split('-')[0].toUpperCase();
      const code = location.state?.roomCode || slug.split('-').pop();
      const isGM = location.state?.isGM || false;
      
      // Si entramos como DJ y el perfil actual no tiene ese dato, podríamos actualizarlo aquí
      // Pero IdentityModal ya maneja la creación.
      
      setRoomData({ title, code, slug, isGM });
    } else {
      setRoomData(null);
    }
  }, [slug, location.state]);

  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') {
      if (slug) emitBackground(data.src);
    } else if (activeModal === 'handout') {
      const newHandout = { id: Date.now(), ...data };
      if (slug) emitHandout(newHandout);
    }
    setActiveModal(null);
  };

  // --- RENDERIZADO ---
  if (!slug) return (<> {remoteBg && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${remoteBg})` }} />} <LobbyModal /> </>);

  // Pasamos el isGM de la sala al IdentityModal para que sepa si eres DJ
  if (!userProfile) {
    return (
      <IdentityModal 
        onComplete={(profile) => {
           // Si la sala dice que soy DJ, forzamos esa propiedad en el perfil
           const finalProfile = { ...profile, isGM: roomData?.isGM || profile.isGM };
           setUserProfile(finalProfile);
        }} 
        existingProfile={userProfile} 
      />
    );
  }

  return (
    <>
      {remoteBg && (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500" style={{ backgroundImage: `url(${remoteBg})`, imageRendering: '-webkit-optimize-contrast' }}>
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[0px]"></div>
        </div>
      )}

      {/* HEADER ACTUALIZADO */}
      <Header 
        isOpen={headerOpen} 
        setIsOpen={setHeaderOpen} 
        onOpenBackgroundModal={() => setActiveModal('background')}
        roomData={roomData} 
        userProfile={userProfile}
        connectedPlayers={connectedPlayers} // <--- NUEVA PROP
        onExit={() => { // <--- FUNCIÓN SALIR
          navigate('/');
          window.location.reload(); // Limpieza dura para asegurar lobby fresco
        }}
      />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform">
          <ChevronDown size={24} />
        </button>
      )}

      {/* BOTONERA LATERAL */}
      <div className="absolute top-28 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><Eraser size={20} /></button>
        {remoteBg && <button onClick={() => emitBackground(null)} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-orange-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><ImageOff size={20} /></button>}
        {/* 3. RESET UI (INTELIGENTE) */}
        <button 
          onClick={() => { 
            // Lista de cosas que NO queremos borrar
            const keysToKeep = ['vtt-user-profile', 'vtt-theme', 'vtt-recent-rooms'];
            
            // Recorremos la memoria y borramos todo lo que no esté en la lista blanca
            Object.keys(localStorage).forEach(key => {
              if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
              }
            });
            
            // Recargamos para aplicar cambios
            window.location.reload(); 
          }} 
          className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group" 
          title="Recolocar Ventanas (Reset UI)"
        >
          <RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={remoteLogs} onClose={() => setShowHistory(false)} onClear={() => {}} />}
      {remoteHandouts.map(h => <ImageWindow key={h.id} id={h.id} data={h} onClose={() => removeHandout(h.id)} />)}

      <ResourceModal isOpen={!!activeModal} onClose={() => setActiveModal(null)} onSubmit={handleResourceSubmit} title={activeModal === 'background' ? "Configurar Fondo" : "Nueva Ayuda"} showTitleInput={activeModal === 'handout'} />

      <Footer isOpen={footerOpen} setIsOpen={setFooterOpen} onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory} onOpenImageModal={() => setActiveModal('handout')} />
    </>
  );
}

export default App;