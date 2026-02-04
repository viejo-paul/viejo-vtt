import { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, remove, onDisconnect } from 'firebase/database';

export function useRoomSync(slug, userProfile) {
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  const [connectedPlayers, setConnectedPlayers] = useState([]); // <--- NUEVO

  // Referencias
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const handoutsRef = ref(database, `rooms/${slug}/handouts`);
  const playersRef = ref(database, `rooms/${slug}/players`); // <--- NUEVO

  // 1. ESCUCHAR CAMBIOS GENERALES
  useEffect(() => {
    if (!slug) return;

    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      setRemoteLogs(data ? Object.values(data).sort((a, b) => b.id - a.id) : []);
    });

    const unsubscribeBg = onValue(bgRef, (snapshot) => setRemoteBg(snapshot.val() || null));

    const unsubscribeHandouts = onValue(handoutsRef, (snapshot) => {
      const data = snapshot.val();
      setRemoteHandouts(data ? Object.values(data) : []);
    });

    // ESCUCHAR JUGADORES CONECTADOS
    const unsubscribePlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      setConnectedPlayers(data ? Object.values(data) : []);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribeHandouts();
      unsubscribePlayers();
    };
  }, [slug]);

  // 2. GESTIÓN DE PRESENCIA (MI USUARIO)
  useEffect(() => {
    if (!slug || !userProfile) return;

    // Creamos una referencia única para mi conexión actual
    // Usamos userProfile.name + un random para evitar conflictos si abres 2 pestañas
    const mySessionId = `${userProfile.name}-${Math.floor(Math.random() * 10000)}`;
    const myUserRef = ref(database, `rooms/${slug}/players/${mySessionId}`);

    // Escribimos mis datos
    set(myUserRef, { 
      name: userProfile.name, 
      color: userProfile.color,
      isGM: userProfile.isGM || false 
    });

    // PROGRAMAMOS LA AUTODESTRUCCIÓN si me desconecto
    onDisconnect(myUserRef).remove();

    // Limpieza al desmontar (cambiar de sala o cerrar componente)
    return () => {
      remove(myUserRef);
    };
  }, [slug, userProfile]); // Se ejecuta si cambia la sala o el perfil

  // 3. EMITTERS
  const emitLog = (logData) => {
    const newLogRef = push(logsRef);
    set(newLogRef, { ...logData, user: userProfile });
  };

  const emitBackground = (data) => set(bgRef, data);
  
  const emitHandout = (handoutData) => {
    const specificHandoutRef = ref(database, `rooms/${slug}/handouts/${handoutData.id}`);
    set(specificHandoutRef, handoutData);
  };

  const removeHandout = (handoutId) => {
    remove(ref(database, `rooms/${slug}/handouts/${handoutId}`));
  };

  return {
    remoteLogs,
    remoteBg,
    remoteHandouts,
    connectedPlayers, // <--- EXPORTAMOS LA LISTA
    emitLog,
    emitBackground,
    emitHandout,
    removeHandout
  };
}