import { useState, useEffect } from 'react';
import { Plus, Users, ArrowRight, Dices, Clock } from 'lucide-react';
import { generateRoomData } from '../utils/roomUtils';
import { useNavigate } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';

export function LobbyModal() {
  const [view, setView] = useState('menu'); // 'menu', 'create', 'join'
  const [title, setTitle] = useState('');
  const [isGM, setIsGM] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [recentRooms, setRecentRooms] = usePersistentState('vtt-recent-rooms', []);
  const navigate = useNavigate();

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title) return;
    
    const { slug, code } = generateRoomData(title);
    
    // Guardamos en recientes
    const newRoomEntry = { title, slug, code, role: isGM ? 'DJ' : 'Jugador', lastVisited: Date.now() };
    setRecentRooms(prev => [newRoomEntry, ...prev.filter(r => r.slug !== slug)].slice(0, 5));

    // Redirigimos (Más tarde aquí guardaremos en Firebase)
    navigate(`/room/${slug}`, { state: { roomTitle: title, roomCode: code, isGM } });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    // Aquí idealmente consultaríamos Firebase para traducir CÓDIGO -> SLUG.
    // De momento, asumiremos que meten el SLUG o URL directa o implementaremos búsqueda luego.
    // Para simplificar hoy: Redirigimos a una url genérica o buscada.
    // NOTA: Para que "Unirse por código" funcione real, necesitamos leer Firebase. 
    // Por ahora, simularemos que el código es parte de la URL si el usuario lo sabe, 
    // o usaremos los recientes.
    alert("Funcionalidad de búsqueda por código requiere conexión a DB (mañana). Usa los enlaces recientes o crea sala.");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-white/10">
        
        {/* CABECERA */}
        <div className="bg-neutral-100 dark:bg-black/40 p-6 text-center border-b border-neutral-200 dark:border-white/5">
          <h1 className="text-3xl font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2">Viejo VTT</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">Tu mesa de rol virtual minimalista</p>
        </div>

        {/* CONTENIDO CAMBIANTE */}
        <div className="p-6">
          
          {/* VISTA: MENÚ PRINCIPAL */}
          {view === 'menu' && (
            <div className="space-y-4">
              <button onClick={() => setView('create')} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:scale-[1.02]">
                <Plus size={24} /> CREAR SALA
              </button>
              <button onClick={() => setView('join')} className="w-full py-4 bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 text-neutral-700 dark:text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all">
                <Users size={24} /> UNIRSE A SALA
              </button>
            </div>
          )}

          {/* VISTA: CREAR SALA */}
          {view === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Título de la Partida</label>
                <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="La Tumba de los Horrores..." className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tablero</label>
                <select disabled className="w-full p-3 bg-neutral-100 dark:bg-black/20 border border-neutral-300 dark:border-white/10 rounded-lg text-neutral-500 cursor-not-allowed">
                  <option>Genérico (Vácio)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-neutral-50 dark:bg-white/5 rounded-lg border border-neutral-200 dark:border-white/10">
                <input type="checkbox" id="gmCheck" checked={isGM} onChange={e => setIsGM(e.target.checked)} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                <label htmlFor="gmCheck" className="text-sm font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none">Entrar como Director de Juego (DJ)</label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setView('menu')} className="px-4 py-2 text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-bold">Volver</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg">LANZAR</button>
              </div>
            </form>
          )}

          {/* VISTA: UNIRSE */}
          {view === 'join' && (
            <div className="space-y-4">
              <form onSubmit={handleJoin} className="flex gap-2">
                <input type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Código de Sala" className="flex-1 p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white" />
                <button type="submit" className="p-3 bg-neutral-800 text-white rounded-lg"><ArrowRight /></button>
              </form>

              {recentRooms.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-neutral-400 uppercase mb-2 flex items-center gap-1"><Clock size={12}/> Recientes</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {recentRooms.map((room, i) => (
                      <button key={i} onClick={() => navigate(`/room/${room.slug}`, { state: { roomTitle: room.title, roomCode: room.code } })} className="w-full p-3 flex justify-between items-center bg-neutral-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-neutral-200 dark:border-white/10 rounded-lg transition-colors group text-left">
                        <div>
                          <div className="font-bold text-sm dark:text-white">{room.title}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">#{room.code} · {room.role}</div>
                        </div>
                        <ArrowRight size={16} className="text-neutral-300 group-hover:text-emerald-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
               <button type="button" onClick={() => setView('menu')} className="w-full py-2 text-neutral-500 font-bold mt-2">Volver</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}