import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, update, remove, onDisconnect } from 'firebase/database';

export function useRoomSync(slug, userProfile, isSessionActive = true) {
  const [roomData, setRoomData] = useState({ background: '' });
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  const [remoteNotes, setRemoteNotes] = useState([]);
  const [remoteLibrary, setRemoteLibrary] = useState([]); 

  // 1. Sincronizar Datos
  useEffect(() => {
    if (!slug) return; // PROTECCIÓN CLAVE

    const roomRef = ref(database, `rooms/${slug}`); 
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoomData(prev => ({ ...prev, background: data.background || '' }));
        if (data.logs) setRemoteLogs(Object.values(data.logs)); else setRemoteLogs([]);
        if (data.handouts) setRemoteHandouts(Object.values(data.handouts)); else setRemoteHandouts([]);
        if (data.notes) setRemoteNotes(Object.values(data.notes)); else setRemoteNotes([]);
        if (data.library) setRemoteLibrary(Object.values(data.library)); else setRemoteLibrary([]);
      }
    });
    return () => unsubscribe();
  }, [slug]);

  // 2. Presencia
  useEffect(() => {
    if (!slug || !userProfile || !isSessionActive) return;

    const playerRef = ref(database, `rooms/${slug}/players/${userProfile.id}`);
    const playersListRef = ref(database, `rooms/${slug}/players`);
    
    set(playerRef, { ...userProfile, online: true, lastSeen: Date.now() });
    onDisconnect(playerRef).remove();

    const unsub = onValue(playersListRef, (snap) => {
        if(snap.exists()) setConnectedPlayers(Object.values(snap.val()));
        else setConnectedPlayers([]);
    });
    return () => { unsub(); remove(playerRef); };
  }, [slug, userProfile, isSessionActive]);

  // Funciones (Protegidas)
  const updateBackground = (url) => { if (slug) update(ref(database, `rooms/${slug}`), { background: url }); };
  const emitLog = (log) => { if (slug) push(ref(database, `rooms/${slug}/logs`), log); };
  const emitHandout = (handout) => { if (slug) set(ref(database, `rooms/${slug}/handouts/${handout.id}`), handout); };
  const removeHandout = (id) => { if (slug) remove(ref(database, `rooms/${slug}/handouts/${id}`)); };
  const emitNote = (note) => { if (slug) set(ref(database, `rooms/${slug}/notes/${note.id}`), note); };
  const removeNote = (id) => { if (slug) remove(ref(database, `rooms/${slug}/notes/${id}`)); };
  const emitResource = (res) => { if (slug) set(ref(database, `rooms/${slug}/library/${res.id}`), res); };
  const updateResource = (id, data) => { if (slug) update(ref(database, `rooms/${slug}/library/${id}`), data); };
  const deleteResource = (id) => { if (slug) remove(ref(database, `rooms/${slug}/library/${id}`)); };

  const joinRoom = (roomSlug, user) => {
    window.location.hash = `/room/${roomSlug}`;
  };

  return { 
    roomData, connectedPlayers, remoteLogs, remoteHandouts, remoteNotes, remoteLibrary,
    updateBackground, emitLog, emitHandout, removeHandout, emitNote, removeNote, 
    emitResource, updateResource, deleteResource, 
    joinRoom, isConnected: !!slug 
  };
}