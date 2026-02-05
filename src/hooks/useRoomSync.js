import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, update, remove, onDisconnect } from 'firebase/database'; // Añadido 'update'

export function useRoomSync(slug, userProfile, isSessionActive) {
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [remoteMetadata, setRemoteMetadata] = useState(null);
  const [remoteAudio, setRemoteAudio] = useState(null);
  
  // NUEVO ESTADO PRINCIPAL
  const [remoteLibrary, setRemoteLibrary] = useState([]); 

  // Referencias
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const playersRef = ref(database, `rooms/${slug}/players`);
  const metadataRef = ref(database, `rooms/${slug}/metadata`);
  const audioRef = ref(database, `rooms/${slug}/audio`);
  
  // NUEVA REFERENCIA DE LIBRERÍA
  const libraryRef = ref(database, `rooms/${slug}/library`);

  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;

    // 1. Logs
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setRemoteLogs(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
    });

    // 2. Background
    const unsubscribeBg = onValue(bgRef, (snapshot) => setRemoteBg(snapshot.val() || null));

    // 3. Players
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setConnectedPlayers(data ? Object.values(data) : []);
    });

    // 4. Metadata
    const unsubscribeMetadata = onValue(metadataRef, (snapshot) => {
      setRemoteMetadata(snapshot.val() || null);
    });

    // 5. Audio
    const unsubscribeAudio = onValue(audioRef, (snapshot) => {
      setRemoteAudio(snapshot.val() || { url: '', isPlaying: false });
    });

    // 6. LIBRERÍA (El Códice Central)
    const unsubscribeLibrary = onValue(libraryRef, (snapshot) => {
      const data = snapshot.val();
      // Convertimos a array y ordenamos por fecha de creación (más reciente primero)
      setRemoteLibrary(data ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt) : []);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribePlayers();
      unsubscribeMetadata();
      unsubscribeAudio();
      unsubscribeLibrary();
    };
  }, [slug, isSessionActive]);

  // Gestión de Presencia (Jugadores Online)
  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;

    const mySessionId = `${userProfile.name}-${Math.floor(Math.random() * 100000)}`;
    const myUserRef = ref(database, `rooms/${slug}/players/${mySessionId}`);

    set(myUserRef, { 
      name: userProfile.name, 
      color: userProfile.color,
      isGM: userProfile.isGM || false 
    });

    onDisconnect(myUserRef).remove();

    return () => {
      remove(myUserRef);
    };
  }, [slug, isSessionActive]);

  // --- EMITTERS (Funciones para escribir en Firebase) ---

  const emitLog = (logData) => {
    if (!isSessionActive) return;
    const newLogRef = push(logsRef);
    set(newLogRef, { ...logData, user: userProfile });
  };

  const emitBackground = (data) => { 
    if(isSessionActive) set(bgRef, data); 
  };
  
  const emitMetadata = (meta) => { 
    if(isSessionActive) set(metadataRef, meta); 
  };
  
  const emitAudio = (audioData) => {
    if (isSessionActive) set(audioRef, audioData);
  };

  // --- GESTIÓN DE RECURSOS (LIBRERÍA) ---

  // Crear o Sobrescribir un recurso completo
  const emitResource = (resourceData) => {
    if (!isSessionActive) return;
    const resourceRef = ref(database, `rooms/${slug}/library/${resourceData.id}`);
    set(resourceRef, resourceData);
  };

  // Actualizar parcialmente (ej: cambiar visibilidad, actualizar contenido)
  const updateResource = (resourceId, updates) => {
    if (!isSessionActive) return;
    const resourceRef = ref(database, `rooms/${slug}/library/${resourceId}`);
    update(resourceRef, updates);
  };

  // Borrar recurso
  const deleteResource = (resourceId) => {
    if (!isSessionActive) return;
    const resourceRef = ref(database, `rooms/${slug}/library/${resourceId}`);
    remove(resourceRef);
  };

  return {
    remoteLogs, 
    remoteBg, 
    connectedPlayers, 
    remoteMetadata, 
    remoteAudio, 
    
    // Nueva Librería
    remoteLibrary,
    emitResource,
    updateResource,
    deleteResource,

    // Funciones antiguas
    emitLog, 
    emitBackground, 
    emitMetadata, 
    emitAudio,

    // COMPATIBILIDAD TEMPORAL (Para que App.jsx no rompa antes de la Fase 2)
    // Devolvemos arrays vacíos para que la UI antigua simplemente no muestre nada
    remoteHandouts: [], 
    remoteNotes: [],
    emitHandout: () => {},
    removeHandout: () => {},
    emitNote: () => {},
    removeNote: () => {}
  };
}