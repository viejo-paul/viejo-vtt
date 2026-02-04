import { useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Music, Play, Pause, Volume2, X, Link as LinkIcon, ExternalLink } from 'lucide-react';

function MusicPlayer({ audioState, isGM, onSyncAudio, onClose }) {
  const [inputUrl, setInputUrl] = useState('');
  const [localVolume, setLocalVolume] = useState(0.5); // Volumen personal
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // Sincronizar con lo que dice Firebase
  useEffect(() => {
    if (audioState) {
      setIsPlaying(audioState.isPlaying);
      setCurrentUrl(audioState.url);
      if (isGM && !inputUrl && audioState.url) setInputUrl(audioState.url);
    }
  }, [audioState, isGM]);

  // Acciones del DJ
  const handleLoad = () => {
    if (inputUrl && isGM) {
      // Al cargar nueva canción, la ponemos en Play automáticamente
      onSyncAudio({ url: inputUrl, isPlaying: true });
    }
  };

  const togglePlay = () => {
    if (isGM) {
      onSyncAudio({ url: currentUrl, isPlaying: !isPlaying });
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] bg-neutral-900 text-white rounded-xl shadow-2xl border border-white/10 w-80 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center p-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-widest">
          <Music size={14} /> DJ Booth
        </div>
        <button onClick={onClose} className="hover:text-red-400 text-neutral-400 transition-colors"><X size={16} /></button>
      </div>

      {/* CONTROLES */}
      <div className="p-4 space-y-4">
        
        {/* ZONA DE CARGA (SOLO DJ) */}
        {isGM ? (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={inputUrl} 
              onChange={(e) => setInputUrl(e.target.value)} 
              placeholder="Enlace de YouTube..." 
              className="flex-1 bg-black/50 border border-white/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-violet-500 placeholder:text-neutral-600"
            />
            <button onClick={handleLoad} className="bg-violet-600 hover:bg-violet-500 p-1.5 rounded text-white transition-colors" title="Cargar y Reproducir">
              <LinkIcon size={14} />
            </button>
          </div>
        ) : (
           // JUGADOR: Solo ve información
           <div className="flex items-center gap-2 text-xs text-neutral-400 bg-white/5 p-2 rounded border border-white/5">
             <ExternalLink size={12} />
             <span className="truncate">{currentUrl ? 'Reproduciendo audio sincronizado' : 'Esperando al DJ...'}</span>
           </div>
        )}

        {/* PLAY/PAUSE Y VOLUMEN */}
        <div className="flex items-center gap-4">
          
          {/* BOTÓN PLAY (El DJ controla el estado global) */}
          <button 
            onClick={togglePlay} 
            disabled={!isGM || !currentUrl} 
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isGM && currentUrl ? 'bg-white text-black hover:scale-105 hover:bg-violet-50' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>

          {/* VOLUMEN (Cada uno controla el suyo) */}
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[10px] text-neutral-400 font-bold uppercase">
                <span>Volumen Local</span>
                <span>{Math.round(localVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
                <Volume2 size={14} className="text-neutral-500" />
                <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={localVolume} 
                onChange={(e) => setLocalVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
            </div>
          </div>
        </div>
      </div>

      {/* REPRODUCTOR OCULTO (El motor que hace sonar la música) */}
      <div className="hidden">
        <ReactPlayer
          url={currentUrl}
          playing={isPlaying}
          volume={localVolume}
          loop={true} // Bucle activado por defecto para ambiente
          width="0"
          height="0"
          controls={false}
          onError={(e) => console.log("Error de audio:", e)}
        />
      </div>
    </div>
  );
}

export default MusicPlayer;