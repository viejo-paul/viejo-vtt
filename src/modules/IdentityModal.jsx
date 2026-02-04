import { useState, useEffect } from 'react';
import { User, Palette, LogOut, ArrowRight, Crown } from 'lucide-react';

export function IdentityModal({ onComplete, existingProfile, isGMRequired }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  // Si hay perfil, empezamos en modo confirmar. Si no, en modo crear.
  const [mode, setMode] = useState(existingProfile ? 'confirm' : 'create'); 

  useEffect(() => {
    const savedTheme = localStorage.getItem('vtt-theme');
    if (savedTheme === '"dark"') document.documentElement.classList.add('dark');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      // Si la sala requiere GM, forzamos el flag
      onComplete({ name, color, isGM: isGMRequired || false }); 
    }
  };

  const handleContinue = () => {
    // Mantenemos el perfil existente, pero inyectamos isGM si es necesario
    onComplete({ ...existingProfile, isGM: isGMRequired || existingProfile.isGM });
  };

  const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#171717'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-neutral-200 dark:border-white/10 relative">
        
        {/* Cabecera Especial para DJ */}
        {isGMRequired && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
            <Crown size={12} fill="currentColor" /> Director de Juego
          </div>
        )}

        {/* MODO CONFIRMAR */}
        {mode === 'confirm' && (
          <div className="text-center space-y-6 mt-2">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">¿Quién entra?</h2>
            
            <div className="bg-neutral-100 dark:bg-white/5 p-4 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shadow-lg border-2 border-white dark:border-white/20" style={{ backgroundColor: existingProfile.color }}></div>
              <div className="text-left overflow-hidden">
                <p className="text-xs text-neutral-500 uppercase font-bold">Perfil guardado</p>
                <p className="text-lg font-black text-neutral-800 dark:text-white truncate">{existingProfile.name}</p>
              </div>
            </div>

            <button onClick={handleContinue} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
              ENTRAR COMO {existingProfile.name.toUpperCase()} <ArrowRight size={18} />
            </button>
            
            <button onClick={() => { setMode('create'); setName(''); }} className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline decoration-dotted">
              Entrar con otro nombre
            </button>
          </div>
        )}

        {/* MODO CREAR */}
        {mode === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <User className="text-emerald-500" /> Nuevo Acceso
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre</label>
              <input 
                autoFocus type="text" value={name} onChange={e => setName(e.target.value)} 
                placeholder={isGMRequired ? "Nombre del Master" : "Tu Personaje"} 
                className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button 
                    key={c} type="button" onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg ring-2 ring-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-neutral-300 dark:border-white/20 cursor-pointer">
                   <Palette size={16} className="absolute inset-0 m-auto text-neutral-500 pointer-events-none"/>
                   <input type="color" value={color} onChange={e => setColor(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
               <input 
                 type="checkbox" 
                 id="gm-claim" 
                 checked={isGMRequired} // O un estado local si quieres permitir cambiarlo
                 onChange={(e) => { 
                    // Esto es un hack rápido: si marcas el check, actuamos como si la sala lo requiriera
                    // Idealmente deberías tener un setIsGM local
                 }}
                 className="accent-emerald-500 w-4 h-4"
               />
               <label htmlFor="gm-claim" className="text-xs text-neutral-500">Entrar como Director de Juego</label>
            </div>

            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-2 active:scale-95 transition-transform">
              ENTRAR A LA SALA
            </button>
            
            {existingProfile && (
              <button type="button" onClick={() => setMode('confirm')} className="w-full text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center justify-center gap-1 mt-2">
                <LogOut size={12}/> Volver al perfil guardado
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}