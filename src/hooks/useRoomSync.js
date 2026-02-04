import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, remove, onDisconnect } from 'firebase/database';

export function useRoomSync(slug, userProfile, isSessionActive) {
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [remoteMetadata, setRemoteMetadata] = useState(null);
  const [remoteNotes, setRemoteNotes] = useState([]); // <--- FALTABA ESTO
  const [remoteAudio, setRemoteAudio] = useState(null); // <--- FALTABA ESTO (Si pusiste música)

  // Referencias
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const handoutsRef = ref(database, `rooms/${slug}/handouts`);
  const playersRef = ref(database, `rooms/${slug}/players`);
  const metadataRef = ref(database, `rooms/${slug}/metadata`);
  const notesRef = ref(database, `rooms/${slug}/notes`); // <--- FALTABA ESTO
  const audioRef = ref(database, `rooms/${slug}/audio`); // <--- FALTABA ESTO

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
      setRemoteNotes(data ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt) : []);
    });

    // ESCUCHAR AUDIO
    const unsubscribeAudio = onValue(audioRef, (snapshot) => {
      setRemoteAudio(snapshot.val() || { url: '', isPlaying: false });
    });

    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribeHandouts();
      unsubscribePlayers();
      unsubscribeMetadata();
      unsubscribeNotes();
      unsubscribeAudio();
    };
  }, [slug, isSessionActive]);

  // GESTIÓN DE PRESENCIA
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

  // EMITTERS NOTAS
  const emitNote = (noteData) => { if (isSessionActive) set(ref(database, `rooms/${slug}/notes/${noteData.id}`), noteData); };
  const removeNote = (noteId) => { remove(ref(database, `rooms/${slug}/notes/${noteId}`)); };

  // EMITTER AUDIO
  const emitAudio = (audioData) => { if (isSessionActive) set(audioRef, audioData); };

  // BORRAR LOGS (Papelera)
  const removeLogs = () => { if (isSessionActive) set(logsRef, null); };

  return {
    remoteLogs, remoteBg, remoteHandouts, connectedPlayers, remoteMetadata, remoteNotes, remoteAudio,
    emitLog, emitBackground, emitHandout, removeHandout, emitMetadata, 
    emitNote, removeNote, emitAudio, removeLogs // <--- IMPORTANTE: removeLogs añadido
  };
}