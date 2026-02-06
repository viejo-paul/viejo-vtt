import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, matchPath, HashRouter } from 'react-router-dom';
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
import LibraryManager from './modules/LibraryManager';
import ResourceWindow from './modules/ResourceWindow';

function AppContent() {
  const [activeModal, setActiveModal] = useState(null); 
  const [userProfile, setUserProfile] = usePersistentState('vtt-user-profile', null);
  const [footerOpen, setFooterOpen] = useState(true);
  
  // Estados de Módulos
  const [showConsole, setShowConsole] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotesManager, setShowNotesManager] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false); 
  const [openNotes, setOpenNotes] = useState([]); 
  const [openResources, setOpenResources] = useState([]); 

  // --- GESTIÓN DE Z-INDEX ---
  // Empezamos en 50 para dejar espacio al tablero (0) y ui baja (10-40)
  const [zIndices, setZIndices] = useState({});
  const [topZ, setTopZ] = useState(50);

  const bringToFront = (id) => {
    setTopZ(prev => {
      const next = prev + 1;
      setZIndices(curr => ({ ...curr, [id]: next }));
      return next;
    });
  };

  const [diceReady, setDiceReady] = useState(false);
  const initialized = useRef(false);
  const [theme] = usePersistentState('vtt-theme', 'dark');
  const location = useLocation(); 

  const match = matchPath("/room/:slug", location.pathname);
  const slug = match ? match.params.slug : null;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    DiceManager.init('#dice-canvas').then(() => {
      setDiceReady(true);
      setTimeout(() => { DiceManager.resize(); DiceManager.updateTheme(theme); }, 500); 
    });
    const handleResize = () => DiceManager.resize();
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
        const canvas = document.getElementById('dice-canvas');
        if (canvas) canvas.style.pointerEvents = 'none';
        initialized.current = false;
    };
  }, []);

  useEffect(() => {
    const canvas = document.getElementById('dice-canvas');
    if (canvas) canvas.style.pointerEvents = 'none'; 
    setFooterOpen(true);
  }, [location]);

  const { 
    roomData, connectedPlayers, remoteLogs, remoteHandouts, remoteNotes, remoteLibrary, 
    updateBackground, emitLog, emitHandout, removeHandout, 
    emitNote, removeNote, 
    emitResource, updateResource, deleteResource, 
    joinRoom 
  } = useRoomSync(slug, userProfile);

  const handleResourceSubmit = (data) => {
    if (activeModal === 'background') updateBackground(data.url);
    else if (activeModal === 'handout') emitHandout({ ...data, type: 'image' });
    setActiveModal(null);
  };

  const handleOpenResource = (item) => {
    const isOpen = openResources.find(r => r.id === item.id);
    if (isOpen) {
      setOpenResources(prev => prev.filter(r => r.id !== item.id));
    } else {
      setOpenResources(prev => [...prev, item]);
      bringToFront(`res-${item.id}`); 
    }
  };

  // --- INTERFAZ DEL JUEGO (GAME LAYOUT) ---
  const gameInterface = (
    <div className="relative w-full h-full overflow-hidden">
       {/* CAPA 0: TABLERO */}
       <BoardCanvas background={roomData.background} />
       
       {/* CAPA 1: VENTANAS (Z-Index Dinámico 50+) */}
       
       {openNotes.map(note => (
         <NoteWindow 
            key={note.id} id={note.id} data={note} 
            zIndex={zIndices[`note-${note.id}`] || 50}
            onFocus={() => bringToFront(`note-${note.id}`)}
            onClose={() => setOpenNotes(prev => prev.filter(n => n.id !== note.id))} 
         />
       ))}

       {remoteHandouts.map(h => (
         <ImageWindow 
            key={h.id} id={h.id} data={h} 
            zIndex={zIndices[`img-${h.id}`] || 50}
            onFocus={() => bringToFront(`img-${h.id}`)}
            onClose={() => removeHandout(h.id)} 
         />
       ))}

       {openResources.map(res => (
         <ResourceWindow 
            key={res.id} id={res.id} data={res} 
            zIndex={zIndices[`res-${res.id}`] || 50}
            onFocus={() => bringToFront(`res-${res.id}`)}
            onClose={() => setOpenResources(prev => prev.filter(r => r.id !== res.id))} 
         />
       ))}

       {showLibrary && (
         <LibraryManager 
           library={remoteLibrary} 
           connectedPlayers={connectedPlayers} 
           currentUser={userProfile} 
           onEmitResource={emitResource}
           onUpdateResource={updateResource}
           onDeleteResource={deleteResource}
           onOpenResource={handleOpenResource}
           openResources={openResources}
           zIndex={zIndices['library'] || 60} 
           onFocus={() => bringToFront('library')}
           onClose={() => setShowLibrary(false)} 
         />
       )}

       {showNotesManager && (
         <NotesManager 
           notes={remoteNotes} 
           connectedPlayers={connectedPlayers} 
           currentUser={userProfile} 
           onEmitNote={emitNote} 
           onDeleteNote={removeNote} 
           onOpenNote={(note) => { if (!openNotes.find(n => n.id === note.id)) setOpenNotes(prev => [...prev, note]); setShowNotesManager(false); }} 
           zIndex={zIndices['notes-manager'] || 60}
           onFocus={() => bringToFront('notes-manager')}
           onClose={() => setShowNotesManager(false)} 
         />
       )}

       {/* CAPA 2: PANELES LATERALES (Z-Index muy alto) */}
       {showConsole && <DiceConsole onClose={() => setShowConsole(false)} onRoll={(f, d) => DiceManager.throwDice(f, d)} />}
       {showHistory && <RollHistory logs={remoteLogs} onClose={() => setShowHistory(false)} onClear={() => {}} />}
       
       {/* CAPA 3: MODALES Y HEADER (Z-Index Máximo) */}
       {!userProfile && <IdentityModal onComplete={(u) => setUserProfile(u)} />}
       <ResourceModal isOpen={!!activeModal} onClose={() => setActiveModal(null)} onSubmit={handleResourceSubmit} title={activeModal === 'background' ? "Fondo" : "Ayuda"} showTitleInput={activeModal === 'handout'} />
       
       <Header isOpen={true} onOpenBackgroundModal={() => setActiveModal('background')} roomData={roomData} userProfile={userProfile} connectedPlayers={connectedPlayers} onExit={() => { setUserProfile(null); window.location.href = '/'; }} />
       
       {/* FOOTER: Z-Index 1000 para asegurar que siempre funciona */}
       <div className="relative z-[1000]">
          <Footer 
            isOpen={footerOpen} setIsOpen={setFooterOpen} 
            onToggleConsole={() => setShowConsole(!showConsole)} isConsoleOpen={showConsole} 
            onToggleHistory={() => setShowHistory(!showHistory)} isHistoryOpen={showHistory} 
            onOpenLibrary={() => { setShowLibrary(!showLibrary); bringToFront('library'); }} 
            onOpenMusic={() => {}}
            onOpenNotes={() => { setShowNotesManager(!showNotesManager); bringToFront('notes-manager'); }} // Botón de notas añadido
          />
       </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<LobbyModal onJoin={(room, user) => { setUserProfile(user); joinRoom(room, user); }} lastProfile={userProfile} />} />
      <Route path="/room/:slug" element={gameInterface} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('vtt-theme');
    if (savedTheme === '"dark"') document.documentElement.classList.add('dark');
  }, []);

  return (
    <HashRouter>
      <div className="fixed inset-0 w-screen h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white transition-colors duration-300 overflow-hidden font-sans selection:bg-emerald-500/30">
        <div id="dice-canvas" className="absolute inset-0 z-10 pointer-events-none"></div>
        <AppContent />
      </div>
    </HashRouter>
  );
}

export default App;