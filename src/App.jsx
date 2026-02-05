import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useParams, useLocation, useNavigate, HashRouter } from 'react-router-dom';
import { ChevronDown, Eraser, RotateCcw } from 'lucide-react';
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
import BoardCanvas from './modules/BoardCanvas'; 
import NotesManager from './modules/NotesManager';
import NoteWindow from './modules/NoteWindow';
import MusicPlayer from './modules/MusicPlayer'; // Asegúrate de tener este archivo creado

function App() {
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
  const navigate = useNavigate();
  const mySessionId = useRef(Math.random().toString(36).substr(2, 9));

  const [userProfile, setUserProfile] = usePersistentState('vtt-user-profile', null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [roomData, setRoomData] = useState(null);

  const scope = slug || 'lobby';
  const [headerOpen, setHeaderOpen] = usePersistentState(`vtt-${scope}-header-open`, true);
  const [footerOpen, setFooterOpen] = usePersistentState(`vtt-${scope}-footer-open`, true);
  const [showConsole, setShowConsole] = usePersistentState(`vtt-${scope}-show-console`, false);
  const [showHistory, setShowHistory] = usePersistentState(`vtt-${scope}-show-history`, false);
  const [theme] = usePersistentState('vtt-theme', 'dark');

  // SYNC COMPLETO
  const { 
    remoteLogs, remoteBg, remoteHandouts, connectedPlayers, remoteMetadata, remoteNotes, remoteAudio,
    emitLog, emitBackground, emitHandout, removeHandout, emitMetadata, 
    emitNote, removeNote, emitAudio, removeLogs 
  } = useRoomSync(slug, userProfile, isSessionActive);

  const [activeModal, setActiveModal] = useState(null); 
  const [diceReady, setDiceReady] = useState(false);
  const initialized = useRef(false);

  // Estados UI Nuevos
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [openNotes, setOpenNotes] = useState([]);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false); // <--- ESTADO DE LA MÚSICA

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

  // Sync 3D
  const lastProcessedLogId = useRef(0);
  useEffect(() => {
    if (remoteLogs.length > 0) {
      const latestLog = remoteLogs[0];
      if (latestLog.id > lastProcessedLogId.current) {
        const isFresh = (Date.now() - latestLog.id) < 5000;
        const isMyRoll = latestLog.sessionId === mySessionId.current;
        if (isFresh && !isMyRoll) {
          const rollConfig = latestLog.results.map(r => ({ sides: parseInt(r.sides), qty: 1, themeColor: r.color }));
          DiceManager.roll(rollConfig);
        }
        lastProcessedLogId.current = latestLog.id;
      }
    }
  }, [remoteLogs]);

  const handleConsoleRoll = async (rollConfig, modifier = 0) => {
    const results = await DiceManager.roll(rollConfig);
    if (results.length > 0) {
      const naturalTotal = results.reduce((acc, r) => acc + r.value, 0);
      const modVal = parseInt(modifier) || 0;
      const newLog = {
        id: Date.now(),
        sessionId: mySessionId.current,
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
      const navTitle = location.state?.roomTitle; 
      const code = location.state?.roomCode || slug.split('-').pop();
      const isGM = location.state?.isGM || false;
      const displayTitle = remoteMetadata?.title || navTitle || slug.split('-')[0].toUpperCase();

      setRoomData({ title: displayTitle, code, slug, isGM });

      if (isGM && navTitle && isSessionActive) {
        if (!remoteMetadata || remoteMetadata.title !== navTitle) {
             emitMetadata({ title: navTitle, code: code, createdAt: Date.now() });
        }
      }
    } else {
      setRoomData(null);
    }
  }, [slug, location.state, remoteMetadata, isSessionActive]);

  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') { if (slug) emitBackground(data.src); } 
    else if (activeModal === 'handout') { const newHandout = { id: Date.now(), ...data }; if (slug) emitHandout(newHandout); }
    setActiveModal(null);
  };

  const handleClearBackground = () => { if (slug) emitBackground(null); setActiveModal(null); };

  // --- RENDER ---
  if (!slug) return (<> {remoteBg && <div className="absolute inset-0 z-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${remoteBg})` }} />} <LobbyModal /> </>);

  if (!isSessionActive) {
    return (
      <IdentityModal 
        existingProfile={userProfile}
        isGMRequired={roomData?.isGM} 
        onComplete={(profile) => {
           setUserProfile(profile);
           setIsSessionActive(true);
        }} 
      />
    );
  }

  return (
    <>
      <BoardCanvas 
         src={remoteBg} 
         isGM={userProfile?.isGM} 
         onConfigBackground={() => setActiveModal('background')} 
      />

      <Header 
        isOpen={headerOpen} setIsOpen={setHeaderOpen} 
        roomData={roomData} userProfile={userProfile} connectedPlayers={connectedPlayers} 
        onExit={() => { navigate('/'); window.location.reload(); }}
      />
      
      {!headerOpen && (
        <button onClick={() => setHeaderOpen(true)} className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-white dark:bg-black/80 p-3 rounded-full shadow-2xl border border-black/10 dark:border-white/10 text-emerald-600 dark:text-emerald-500 hover:scale-110 transition-transform">
          <ChevronDown size={24} />
        </button>
      )}

      {/* Botonera Derecha */}
      <div className="absolute top-28 right-6 z-20 flex flex-col gap-3">
        <button onClick={() => DiceManager.clear()} className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-red-500 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl"><Eraser size={20} /></button>
        <button onClick={() => { 
            const keysToKeep = ['vtt-user-profile', 'vtt-theme', 'vtt-recent-rooms'];
            Object.keys(localStorage).forEach(key => { if (!keysToKeep.includes(key)) localStorage.removeItem(key); });
            window.location.reload(); 
          }} 
          className="bg-white dark:bg-neutral-900/60 backdrop-blur-md p-3 rounded-full hover:bg-blue-600 text-neutral-500 dark:text-neutral-400 hover:text-white border border-neutral-300 dark:border-white/10 transition-all shadow-xl group"
        >
          <RotateCcw size={20} className="group-active:-rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={handleConsoleRoll} />}
      {showHistory && <RollHistory logs={remoteLogs} onClose={() => setShowHistory(false)} onClear={removeLogs} />}
      {remoteHandouts.map(h => <ImageWindow key={h.id} id={h.id} data={h} onClose={() => removeHandout(h.id)} />)}

      {/* NOTAS */}
      {openNotes.map(note => (
        <NoteWindow 
          key={note.id} 
          id={note.id} 
          data={note} 
          onClose={() => setOpenNotes(prev => prev.filter(n => n.id !== note.id))} 
        />
      ))}

      {showNotesManager && (
        <NotesManager 
          notes={remoteNotes}
          connectedPlayers={connectedPlayers}
          currentUser={userProfile}
          onEmitNote={emitNote}
          onDeleteNote={removeNote}
          onOpenNote={(note) => {
            if (!openNotes.find(n => n.id === note.id)) setOpenNotes(prev => [...prev, note]);
            setShowNotesManager(false);
          }}
          onClose={() => setShowNotesManager(false)}
        />
      )}

      {/* MÚSICA: Siempre montado para evitar cortes y errores de Play/Pause */}
      <div className={showMusicPlayer ? 'contents' : 'hidden'}>
        <MusicPlayer 
          audioState={remoteAudio} 
          isGM={roomData?.isGM} 
          onSyncAudio={emitAudio} 
          onClose={() => setShowMusicPlayer(false)} 
        />
      </div>

      <ResourceModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleResourceSubmit} 
        onClear={activeModal === 'background' && remoteBg ? handleClearBackground : null}
        title={activeModal === 'background' ? "Configurar Tablero" : "Nueva imagen"} 
        showTitleInput={activeModal === 'handout'} 
      />

      <Footer 
        isOpen={footerOpen} setIsOpen={setFooterOpen} 
        onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} 
        onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory} 
        onOpenImageModal={() => setActiveModal('handout')} 
        onOpenNotes={() => setShowNotesManager(true)}
        // AQUÍ ESTÁ LA MAGIA: Pasamos la función al Footer
        onOpenMusic={() => setShowMusicPlayer(!showMusicPlayer)} 
      />
    </>
  );
}

export default App;