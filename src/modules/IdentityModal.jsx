import { useState, useEffect } from 'react';
import { User, Palette, LogOut, ArrowRight } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

export function IdentityModal({ onComplete, existingProfile }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [mode, setMode] = useState(existingProfile ? 'confirm' : 'create'); // 'confirm' | 'create'

  // Detectar tema para el modal (lectura directa para evitar flash)
  useEffect(() => {
    const savedTheme = localStorage.getItem('vtt-theme');
    if (savedTheme === '"dark"') document.documentElement.classList.add('dark');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onComplete({ name, color });
  };

  const handleContinue = () => {
    onComplete(existingProfile);
  };

  const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#171717'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-neutral-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-neutral-200 dark:border-white/10 relative overflow-hidden">
        
        {/* MODO CONFIRMAR (Si ya existía usuario) */}
        {mode === 'confirm' && (
          <div className="text-center space-y-6">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">¡Hola de nuevo!</h2>
            
            <div className="bg-neutral-100 dark:bg-white/5 p-4 rounded-xl border border-neutral-200 dark:border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full shadow-lg border-2 border-white dark:border-white/20" style={{ backgroundColor: existingProfile.color }}></div>
              <div className="text-left">
                <p className="text-xs text-neutral-500 uppercase font-bold">Entrar como</p>
                <p className="text-lg font-black text-neutral-800 dark:text-white">{existingProfile.name}</p>
              </div>
            </div>

            <button onClick={handleContinue} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
              CONTINUAR <ArrowRight size={18} />
            </button>
            
            <button onClick={() => setMode('create')} className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline decoration-dotted">
              No, quiero crear otro perfil
            </button>
          </div>
        )}

        {/* MODO CREAR NUEVO */}
        {mode === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <User className="text-emerald-500" /> Identifícate
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nombre / Personaje</label>
              <input 
                autoFocus type="text" value={name} onChange={e => setName(e.target.value)} 
                placeholder="Ej: Gandalf el Gris" 
                className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Elige tu Color</label>
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

            <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-2">
              ENTRAR A LA SALA
            </button>
            
            {existingProfile && (
              <button type="button" onClick={() => setMode('confirm')} className="w-full text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center justify-center gap-1">
                <LogOut size={12}/> Volver al usuario anterior
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}