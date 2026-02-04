import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, HashRouter } from 'react-router-dom';
import { Eraser, ImageOff, RotateCcw } from 'lucide-react';
import { useRoomSync } from './hooks/useRoomSync'; 

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
  // Inicialización temprana del tema para evitar flashes blancos en Lobby
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
  
  // ==========================================
  // 1. GESTIÓN DE IDENTIDAD
  // ==========================================
  // Guardamos el perfil "global" en el navegador, pero podemos cambiarlo
  const [userProfile, setUserProfile] = usePersistentState('vtt-user-profile', null);
  const [roomData, setRoomData] = useState(null);

  // ==========================================
  // 2. CONEXIÓN FIREBASE
  // ==========================================
  const { 
    remoteLogs, remoteBg, remoteHandouts, 
    emitLog, emitBackground, emitHandout, removeHandout 
  } = useRoomSync(slug, userProfile);

  // ==========================================
  // 3. PERSISTENCIA SCOPED (POR SALA)
  // ==========================================
  // Truco: Usamos el slug en la clave. Si no hay slug (lobby), usamos 'lobby'.
  const scope = slug || 'lobby';
  
  const [headerOpen, setHeaderOpen] = usePersistentState(`vtt-${scope}-header-open`, true);
  const [footerOpen, setFooterOpen] = usePersistentState(`vtt-${scope}-footer-open`, true);
  const [showConsole, setShowConsole] = usePersistentState(`vtt-${scope}-show-console`, false);
  const [showHistory, setShowHistory] = usePersistentState(`vtt-${scope}-show-history`, false);
  // El tema es global, no depende de la sala
  const [theme] = usePersistentState('vtt-theme', 'dark');

  // ==========================================
  // 4. LÓGICA DE DADOS REMOTA (SYNC 3D)
  // ==========================================
  const lastProcessedLogId = useRef(0);
  const diceReady = useRef(false);

  // Inicializar Motor 3D
  useEffect(() => {
    if (diceReady.current) return;
    diceReady.current = true;
    DiceManager.init('#dice-canvas').then(() => {
      // Pequeño delay para asegurar carga
      setTimeout(() => {
        DiceManager.resize();
        DiceManager.updateTheme(theme);
      }, 200);
    });
    
    const handleResize = () => DiceManager.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Actualizar tema si cambia
  useEffect(() => {
    try { DiceManager.updateTheme(theme); } catch(e){}
  }, [theme]);

  // EL CEREBRO DE SINCRONIZACIÓN VISUAL
  // Cuando llegan logs nuevos de Firebase, miramos si hay alguno nuevo para rodar
  useEffect(() => {
    if (remoteLogs.length > 0) {
      const latestLog = remoteLogs[0]; // El más reciente (porque los ordenamos en el hook)
      
      // Si el ID del log es mayor que el último procesado...
      if (latestLog.id > lastProcessedLogId.current) {
        
        // Evitamos rodar al entrar en la sala (carga inicial)
        // Solo rodamos si el log es "fresco" (menos de 5 segundos de antigüedad)
        const isFresh = (Date.now() - latestLog.id) < 5000;
        
        if (isFresh) {
          // Convertimos el formato de log guardado al formato que necesita DiceManager
          const rollConfig = latestLog.results.map(r => ({
             sides: parseInt(r.sides), 
             qty: 1, // En el log guardamos dados individuales, así que qty siempre 1 por grupo visual
             themeColor: r.color
          }));
          
          // ¡RODAMOS SIN CALCULAR RESULTADO! (Solo efecto visual)
          // El resultado ya lo tenemos en el log, DiceManager solo debe "actuar"
          // NOTA: DiceManager.roll devuelve resultados aleatorios. 
          // Para una sync perfecta, necesitaríamos un DiceManager que acepte resultados forzados.
          // Por ahora, para mantenerlo simple, dejamos que ruede aleatorio visualmente,
          // pero mostramos el resultado REAL numérico en el Historial.
          DiceManager.roll(rollConfig).then(() => {
             // Roll visual completado
          });
        }
        
        lastProcessedLogId.current = latestLog.id;
      }
    }
  }, [remoteLogs]);

  // ==========================================
  // 5. MANEJADORES
  // ==========================================
  const handleConsoleRoll = async (rollConfig, modifier = 0) => {
    // 1. Nosotros tiramos (Generamos el azar aquí)
    const results = await DiceManager.roll(rollConfig);
    
    if (results.length > 0) {
      const naturalTotal = results.reduce((acc, r) => acc + r.value, 0);
      const modVal = parseInt(modifier) || 0;
      
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        // user se añade en el hook
        modifier: modVal,
        total: naturalTotal + modVal,
        results: results.map(r => ({ value: r.value, sides: r.sides, color: r.themeColor }))
      };
      
      // 2. Enviamos la Verdad a la nube
      if (slug) emitLog(newLog);
      setShowHistory(true);
    }
  };

  // Configuración de Sala
  useEffect(() => {
    if (slug) {
      const title = location.state?.roomTitle || slug.split('-')[0].toUpperCase();
      const code = location.state?.roomCode || slug.split('-').pop();
      const isGM = location.state?.isGM || false;
      setRoomData({ title, code, slug, isGM });
    } else {
      setRoomData(null);
    }
  }, [slug, location.state]);

  const [activeModal, setActiveModal] = useState(null); 
  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') {
      if (slug) emitBackground(data.src);
    } else if (activeModal === 'handout') {
      const newHandout = { id: Date.now(), ...data };
      if (slug) emitHandout(newHandout);
    }
    setActiveModal(null);
  };

  // ==========================================
  // 6. RENDERIZADO
  // ==========================================

  // A) LOBBY
  if (!slug) {
    return (
      <>
        {remoteBg && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${remoteBg})` }} />}
        <LobbyModal />
      </>
    );
  }

  // B) LOGIN SALA
  if (!userProfile) {
    return <IdentityModal onComplete={setUserProfile} existingProfile={userProfile /*Pasamos null si no hay*/} />;
  }
  
  // Un pequeño hack: si tenemos perfil pero acabamos de entrar y queremos confirmar
  // IdentityModal ya maneja esto internamente si le pasas existingProfile,
  // pero aquí si userProfile es true, renderizamos el juego. 
  // Para forzar la pregunta "Continuar como..." necesitamos un estado intermedio 'confirmed'.
  // Para simplificar hoy: Asumimos que si hay perfil, entra directo.
  // Si quieres el modal de "Continuar", necesitaríamos cambiar la condición arriba.
  // Vamos a dejarlo así por ahora para no complicar más el código hoy.
  
  return (
    <>
      {/* FONDO */}
      {remoteBg && (
        <div className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500" style={{ backgroundImage: `url(${remoteBg})`, imageRendering: '-webkit-optimize-contrast' }}>
          <div className="absolute inset-0 bg-white/30 dark:bg-black/40 backdrop-blur-[0px]"></div>
        </div>
      )}

      <Header 
        isOpen={headerOpen} setIsOpen={setHeaderOpen} 
        onOpenBackgroundModal={() => setActiveModal('background')}
        roomData={roomData} userProfile={userProfile}
      />

      {/* BOTONERA LATERAL */}
      <div className="absolute top-24 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><Eraser size={20} /></button>
        {remoteBg && <button onClick={() => emitBackground(null)} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-orange-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><ImageOff size={20} /></button>}
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group"><RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" /></button>
      </div>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={remoteLogs} onClose={() => setShowHistory(false)} onClear={() => {}} />}
      {remoteHandouts.map(h => <ImageWindow key={h.id} id={h.id} data={h} onClose={() => removeHandout(h.id)} />)}

      <ResourceModal 
        isOpen={!!activeModal} onClose={() => setActiveModal(null)} onSubmit={handleResourceSubmit} 
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