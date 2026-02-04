import { useEffect, useState, useRef } from 'react';
import { database } from '../firebase';
import { ref, onValue, push, set, remove, get } from 'firebase/database';

export function useRoomSync(slug, userProfile) {
  // Estados locales que vendrán de la nube
  const [remoteLogs, setRemoteLogs] = useState([]);
  const [remoteBg, setRemoteBg] = useState(null);
  const [remoteHandouts, setRemoteHandouts] = useState([]);
  
  // Referencias a la base de datos
  const roomRef = ref(database, `rooms/${slug}`);
  const logsRef = ref(database, `rooms/${slug}/logs`);
  const bgRef = ref(database, `rooms/${slug}/background`);
  const handoutsRef = ref(database, `rooms/${slug}/handouts`);

  // 1. ESCUCHAR CAMBIOS (Solo si hay sala "slug")
  useEffect(() => {
    if (!slug) return;

    // A) Escuchar Logs (Historial)
    const unsubscribeLogs = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertimos el objeto de objetos de Firebase a un Array ordenado
        const logsArray = Object.values(data).sort((a, b) => b.id - a.id);
        setRemoteLogs(logsArray);
      } else {
        setRemoteLogs([]);
      }
    });

    // B) Escuchar Fondo
    const unsubscribeBg = onValue(bgRef, (snapshot) => {
      setRemoteBg(snapshot.val() || null);
    });

    // C) Escuchar Handouts (Ventanas)
    const unsubscribeHandouts = onValue(handoutsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRemoteHandouts(Object.values(data));
      } else {
        setRemoteHandouts([]);
      }
    });

    // Limpieza al salir de la sala
    return () => {
      unsubscribeLogs();
      unsubscribeBg();
      unsubscribeHandouts();
    };
  }, [slug]);


  // 2. FUNCIONES PARA ENVIAR DATOS (EMITTERS)

  const emitLog = (logData) => {
    // Añadimos el usuario actual al log antes de enviarlo
    const newLogRef = push(logsRef);
    set(newLogRef, { ...logData, user: userProfile });
  };

  const emitBackground = (bgData) => {
    // bgData puede ser null (borrar) o una string Base64/URL
    set(bgRef, bgData);
  };

  const emitHandout = (handoutData) => {
    // Usamos el ID del handout como clave para poder borrarlo luego fácilmente
    const specificHandoutRef = ref(database, `rooms/${slug}/handouts/${handoutData.id}`);
    set(specificHandoutRef, handoutData);
  };

  const removeHandout = (handoutId) => {
    const specificHandoutRef = ref(database, `rooms/${slug}/handouts/${handoutId}`);
    remove(specificHandoutRef);
  };

  const clearTable = () => {
    // Opcional: Borrar logs o resetear todo
    // remove(logsRef); // Si quisieras borrar historial
    // remove(handoutsRef); // Si quisieras cerrar todas las ventanas
  };

  return {
    remoteLogs,
    remoteBg,
    remoteHandouts,
    emitLog,
    emitBackground,
    emitHandout,
    removeHandout,
    clearTable
  };
}