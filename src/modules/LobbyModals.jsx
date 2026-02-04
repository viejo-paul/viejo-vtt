import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Dices, Search, Loader2 } from 'lucide-react';
import { generateRoomCode } from '../utils/roomUtils'; // Asegúrate de tener esto o usa un generador simple
// IMPORTACIONES FIREBASE
import { database } from '../firebase';
import { ref, get, query, orderByChild, equalTo } from 'firebase/database';

export function LobbyModal() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('menu'); // 'menu', 'create', 'join'
  const [roomTitle, setRoomTitle] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isSearching, setIsSearching] = useState(false); // Estado de carga
  const [error, setError] = useState(null);

  // CREAR SALA (Igual que antes)
  const handleCreate = (e) => {
    e.preventDefault();
    if (!roomTitle.trim()) return;
    
    const code = generateRoomCode();
    // Creamos un slug amigable: "titulo-del-juego-CODIGO"
    const slug = `${roomTitle.trim().toLowerCase().replace(/\s+/g, '-')}-${code}`;
    
    navigate(`/room/${slug}`, { 
      state: { 
        roomTitle, 
        roomCode: code,
        isGM: true 
      } 
    });
  };

  // UNIRSE POR CÓDIGO (La magia nueva)
  const handleJoin = async (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;

    setIsSearching(true);
    setError(null);

    try {
      // 1. Referencia a todas las salas
      const roomsRef = ref(database, 'rooms');
      
      // 2. Consulta: Ordena por 'metadata/code' y busca el que sea igual a 'code'
      // NOTA: Para que esto vaya ultra-rápido con miles de salas, habría que indexar en Firebase,
      // pero para uso normal funciona perfecto sin configurar nada extra.
      const q = query(roomsRef, orderByChild('metadata/code'), equalTo(code));
      
      // 3. Ejecutar consulta
      const snapshot = await get(q);

      if (snapshot.exists()) {
        // ¡Encontrada! snapshot.val() devuelve un objeto con las salas que coinciden.
        // Como el código es único (o debería), cogemos la primera llave.
        const roomsData = snapshot.val();
        const slug = Object.keys(roomsData)[0]; // La clave de la sala es el slug (ej: "dnd-partida-XK92")
        
        navigate(`/room/${slug}`, {
            state: {
                // No sabemos el título exacto aquí sin leerlo, pero la App lo leerá de Firebase al entrar
                roomCode: code,
                isGM: false
            }
        });
      } else {
        setError("No he encontrado ninguna sala con ese código.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al buscar la sala.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- RENDERIZADO ---

  if (mode === 'menu') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
        <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-neutral-900 dark:bg-white rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-6 transition-transform">
               <Dices size={48} className="text-white dark:text-neutral-900" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black tracking-tighter text-neutral-900 dark:text-white mb-2">
            VIEJO <span className="text-emerald-600 dark:text-emerald-500">VTT</span>
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">Tablero Virtual Minimalista</p>

          <div className="space-y-3 pt-4">
            <button onClick={() => setMode('create')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 transition-transform active:scale-95 text-lg">
              <Plus size={24} /> CREAR SALA
            </button>
            <button onClick={() => setMode('join')} className="w-full py-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-bold rounded-2xl shadow-lg border border-neutral-200 dark:border-white/10 flex items-center justify-center gap-3 transition-transform active:scale-95 text-lg">
              <ArrowRight size={24} /> UNIRSE A PARTIDA
            </button>
          </div>
          
          {/* LISTA DE SALAS RECIENTES (localStorage) - Opcional, ya lo tenías */}
          <RecentRooms />
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
        <form onSubmit={handleCreate} className="max-w-sm w-full bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl border border-neutral-200 dark:border-white/10 relative animate-in slide-in-from-bottom-10 duration-300">
          <button type="button" onClick={() => setMode('menu')} className="absolute top-4 right-4 p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-400">✕</button>
          
          <h2 className="text-2xl font-black text-neutral-800 dark:text-white mb-6">Nueva Partida</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre de la Sala</label>
              <input 
                autoFocus
                type="text" 
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="Ej: La Mina Perdida" 
                className="w-full p-4 bg-neutral-100 dark:bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-lg font-bold dark:text-white transition-colors"
              />
            </div>
            
            <button type="submit" disabled={!roomTitle.trim()} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4">
              LANZAR DADOS <Dices size={20}/>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-4">
        <form onSubmit={handleJoin} className="max-w-sm w-full bg-white dark:bg-neutral-900 p-8 rounded-3xl shadow-2xl border border-neutral-200 dark:border-white/10 relative animate-in slide-in-from-bottom-10 duration-300">
          <button type="button" onClick={() => { setMode('menu'); setError(null); }} className="absolute top-4 right-4 p-2 hover:bg-neutral-100 dark:hover:bg-white/10 rounded-full text-neutral-400">✕</button>
          
          <h2 className="text-2xl font-black text-neutral-800 dark:text-white mb-2">Unirse a Sala</h2>
          <p className="text-sm text-neutral-500 mb-6">Introduce el código de 4 caracteres que te ha dado el DJ.</p>
          
          <div className="space-y-4">
            <div className="relative">
              <input 
                autoFocus
                type="text" 
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCD" 
                className="w-full p-4 text-center tracking-[0.5em] uppercase bg-neutral-100 dark:bg-black/40 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-2xl font-black dark:text-white transition-colors placeholder:tracking-normal"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-neutral-400">
                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium text-center animate-in shake">
                {error}
              </div>
            )}
            
            <button type="submit" disabled={joinCode.length < 4 || isSearching} className="w-full py-4 bg-neutral-800 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-black font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-colors">
              {isSearching ? 'BUSCANDO...' : 'ENTRAR'}
            </button>
          </div>
        </form>
      </div>
    );
  }
}

// Subcomponente simple para salas recientes (si lo usas)
function RecentRooms() {
  const [recents, setRecents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vtt-recent-rooms') || '[]');
    } catch { return []; }
  });

  if (recents.length === 0) return null;

  return (
    <div className="pt-8 border-t border-neutral-200 dark:border-white/10 mt-6">
      <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Recientes</p>
      <div className="flex flex-wrap justify-center gap-2">
        {recents.slice(0, 3).map((r, i) => (
          <a key={i} href={`#/room/${r.slug}`} className="px-3 py-1.5 bg-white ... truncate max-w-[200px] md:max-w-none"> 
            {/* Aumenta max-w o quítalo en pantallas grandes */}
            {r.title}
          </a>
        ))}
      </div>
    </div>
  );
}