import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, remove, onDisconnect } from 'firebase/database';

export function useRoomSync(slug, userProfile, isSessionActive) {
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [remoteMetadata, setRemoteMetadata] = useState(null);
  const [remoteNotes, setRemoteNotes] = useState([]); // <--- NUEVO

  // Referencias
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const handoutsRef = ref(database, `rooms/${slug}/handouts`);
  const playersRef = ref(database, `rooms/${slug}/players`);
  const metadataRef = ref(database, `rooms/${slug}/metadata`);
  const notesRef = ref(database, `rooms/${slug}/notes`); // <--- NUEVO

  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;

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

    const unsubscribeMetadata = onValue(metadataRef, (snapshot) => {
      setRemoteMetadata(snapshot.val() || null);
    });

    // ESCUCHAR NOTAS
    const unsubscribeNotes = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      // Ordenamos por fecha (más nuevas arriba)
      setRemoteNotes(data ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt) : []);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribeHandouts();
      unsubscribePlayers();
      unsubscribeMetadata();
      unsubscribeNotes();
    };
  }, [slug, isSessionActive]);

  // ... (Gestión de presencia sigue igual) ...
  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;
    const mySessionId = `${userProfile.name}-${Math.floor(Math.random() * 100000)}`;
    const myUserRef = ref(database, `rooms/${slug}/players/${mySessionId}`);
    set(myUserRef, { name: userProfile.name, color: userProfile.color, isGM: userProfile.isGM || false });
    onDisconnect(myUserRef).remove();
    return () => { remove(myUserRef); };
  }, [slug, isSessionActive]);


  // EMITTERS
  const emitLog = (logData) => { if (isSessionActive) { const newLogRef = push(logsRef); set(newLogRef, { ...logData, user: userProfile }); }};
  const emitBackground = (data) => { if(isSessionActive) set(bgRef, data); };
  const emitMetadata = (meta) => { if(isSessionActive) set(metadataRef, meta); };
  
  const emitHandout = (handoutData) => {
    if(!isSessionActive) return;
    const specificHandoutRef = ref(database, `rooms/${slug}/handouts/${handoutData.id}`);
    set(specificHandoutRef, handoutData);
  };
  const removeHandout = (handoutId) => { remove(ref(database, `rooms/${slug}/handouts/${handoutId}`)); };

  // NUEVOS EMITTERS PARA NOTAS
  const emitNote = (noteData) => {
    if (!isSessionActive) return;
    // Usamos el ID de la nota como clave
    const specificNoteRef = ref(database, `rooms/${slug}/notes/${noteData.id}`);
    set(specificNoteRef, noteData);
  };

  const removeNote = (noteId) => {
    remove(ref(database, `rooms/${slug}/notes/${noteId}`));
  };

  const removeLogs = () => {
    if (isSessionActive) set(logsRef, null); // Borra todo el nodo logs
  };

  return {
    remoteLogs, remoteBg, remoteHandouts, connectedPlayers, remoteMetadata, remoteNotes, // <--- EXPORTAR
    emitLog, emitBackground, emitHandout, removeHandout, emitMetadata, 
    removeLogs,
    emitNote, removeNote // <--- EXPORTAR
  };
}