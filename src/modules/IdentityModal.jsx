import { useState } from 'react';
import { User, Palette } from 'lucide-react';
import { usePersistentState } from '../hooks/usePersistentState';

export function IdentityModal({ onComplete }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981'); // Esmeralda por defecto

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete({ name, color });
    }
  };

  const colors = ['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-neutral-200 dark:border-white/10">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
          <User className="text-emerald-500" /> ¿Quién eres?
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tu Nombre / Personaje</label>
            <input 
              autoFocus type="text" value={name} onChange={e => setName(e.target.value)} 
              placeholder="Ej: Gandalf el Gris" 
              className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              required 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Tu Color</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button 
                  key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0" />
            </div>
          </div>

          <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-2">
            ENTRAR A LA SALA
          </button>
        </form>
      </div>
    </div>
  );
}