import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, remove, onDisconnect } from 'firebase/database';

export function useRoomSync(slug, userProfile, isSessionActive) { // <--- Nuevo param isSessionActive
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [remoteMetadata, setRemoteMetadata] = useState(null); // <--- guarda titulo y datos

  // Referencias
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const handoutsRef = ref(database, `rooms/${slug}/handouts`);
  const playersRef = ref(database, `rooms/${slug}/players`);
  const metadataRef = ref(database, `rooms/${slug}/metadata`); 

  // 1. ESCUCHAR CAMBIOS (Solo si hay slug y la sesión está activa)
  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return; // <--- EL GUARDIÁN

    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setRemoteLogs(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
    });

    const unsubscribeBg = onValue(bgRef, (snapshot) => setRemoteBg(snapshot.val() || null));

    const unsubscribeHandouts = onValue(handoutsRef, (snapshot) => {
      const data = snapshot.val();
      setRemoteHandouts(data ? Object.values(data) : []);
    });

    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setConnectedPlayers(data ? Object.values(data) : []);
    });

    // ESCUCHAR METADATOS (TÍTULO)
    const unsubscribeMetadata = onValue(metadataRef, (snapshot) => {
      setRemoteMetadata(snapshot.val() || null);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribeHandouts();
      unsubscribePlayers();
      unsubscribeMetadata();
    };
  }, [slug, isSessionActive]); // userProfile quitado de deps para evitar reconexión si cambia algo interno irrelevante, pero vigilado arriba

  // 2. GESTIÓN DE PRESENCIA
  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;

    // Crear ID de sesión único para esta pestaña
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
  }, [slug, isSessionActive]); // <--- Solo conecta cuando el usuario da al botón "Entrar"

  // 3. EMITTERS
  const emitLog = (logData) => {
    if (!isSessionActive) return;
    const newLogRef = push(logsRef);
    set(newLogRef, { ...logData, user: userProfile });
  };

  const emitMetadata = (meta) => {
    if(isSessionActive) set(metadataRef, meta);
  };

  const emitBackground = (data) => { if(isSessionActive) set(bgRef, data); };
  
  const emitHandout = (handoutData) => {
    if(!isSessionActive) return;
    const specificHandoutRef = ref(database, `rooms/${slug}/handouts/${handoutData.id}`);
    set(specificHandoutRef, handoutData);
  };

  const removeHandout = (handoutId) => {
    remove(ref(database, `rooms/${slug}/handouts/${handoutId}`));
  };

  return {
    remoteLogs, remoteBg, remoteHandouts, connectedPlayers, remoteMetadata, // <--- EXPORTAR
    emitLog, emitBackground, emitHandout, removeHandout, emitMetadata // <--- EXPORTAR
  };
}