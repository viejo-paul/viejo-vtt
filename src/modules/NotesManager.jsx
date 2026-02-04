import { useState, useRef } from 'react';
import { X, Plus, Search, Image as ImageIcon, Send, Trash2, Users, Eye } from 'lucide-react';

function NotesManager({ notes, connectedPlayers, currentUser, onEmitNote, onDeleteNote, onOpenNote, onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'create'
  
  // Estados para crear nota
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [targets, setTargets] = useState(['ALL']); // ['ALL'] o array de nombres
  
  const fileInputRef = useRef(null);

  // Filtrar notas: Las que creé yo, o las que están asignadas a mí (o ALL)
  const myNotes = notes.filter(n => {
    const isAuthor = n.author === currentUser.name;
    const isTarget = n.targets.includes('ALL') || n.targets.includes(currentUser.name);
    return isAuthor || isTarget;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote = {
      id: Date.now(),
      title,
      content,
      image,
      author: currentUser.name,
      targets: targets,
      createdAt: Date.now()
    };

    onEmitNote(newNote);
    
    // Reset y volver a lista
    setTitle('');
    setContent('');
    setImage('');
    setTargets(['ALL']);
    setView('list');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleTarget = (name) => {
    if (name === 'ALL') {
      setTargets(['ALL']);
    } else {
      let newTargets = targets.filter(t => t !== 'ALL');
      if (newTargets.includes(name)) newTargets = newTargets.filter(t => t !== name);
      else newTargets.push(name);
      
      if (newTargets.length === 0) newTargets = ['ALL']; // Fallback a todos
      setTargets(newTargets);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200 dark:border-white/10">
        
        {/* CABECERA */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5">
          <h2 className="text-lg font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            📝 Gestor de Notas
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-red-100 dark:hover:bg-white/10 rounded-full text-neutral-500 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-hidden flex flex-col">
          
          {view === 'list' && (
            <>
              <div className="p-4 border-b border-neutral-100 dark:border-white/5 flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute top-3 left-3 text-neutral-400"/>
                  <input type="text" placeholder="Buscar notas..." className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-black/20 rounded-lg text-sm outline-none dark:text-white" />
                </div>
                <button onClick={() => setView('create')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm transition-colors">
                  <Plus size={16}/> Nueva Nota
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {myNotes.length === 0 ? (
                  <div className="text-center text-neutral-400 mt-10 text-sm">No hay notas todavía.</div>
                ) : (
                  myNotes.map(note => (
                    <div key={note.id} className="bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-3 flex justify-between items-start group hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
                      <div className="flex-1 cursor-pointer" onClick={() => onOpenNote(note)}>
                        <h3 className="font-bold text-neutral-800 dark:text-white text-sm mb-1">{note.title}</h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{note.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-400">
                          <span className={`px-1.5 py-0.5 rounded ${note.author === currentUser.name ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-white/10'}`}>
                            {note.author === currentUser.name ? 'Mía' : `De: ${note.author}`}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Users size={10}/> {note.targets.includes('ALL') ? 'Todos' : note.targets.join(', ')}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onOpenNote(note)} className="p-1.5 bg-neutral-100 dark:bg-white/10 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg" title="Abrir">
                          <Eye size={16} />
                        </button>
                        {note.author === currentUser.name && (
                          <button onClick={() => { if(confirm('¿Borrar nota?')) onDeleteNote(note.id) }} className="p-1.5 bg-neutral-100 dark:bg-white/10 hover:bg-red-100 hover:text-red-600 rounded-lg" title="Borrar">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'create' && (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form onSubmit={handleCreate} className="space-y-4 max-w-xl mx-auto">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Título</label>
                  <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Carta del Rey, Pista Secreta..." className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Contenido</label>
                  <textarea rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Escribe aquí el texto..." className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen (Opcional)</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current.click()} className="px-3 py-2 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <ImageIcon size={16} /> Subir
                    </button>
                    <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="o pega una URL..." className="flex-1 p-2 bg-transparent border-b border-neutral-200 dark:border-white/10 outline-none text-sm dark:text-white" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>
                  {image && <img src={image} alt="Preview" className="mt-2 h-20 rounded border border-neutral-200 dark:border-white/10" />}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Asignar a:</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleTarget('ALL')} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${targets.includes('ALL') ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500'}`}>
                      TODOS
                    </button>
                    {connectedPlayers.filter(p => p.name !== currentUser.name).map(p => (
                      <button key={p.name} type="button" onClick={() => toggleTarget(p.name)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${!targets.includes('ALL') && targets.includes(p.name) ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500'}`}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setView('list')} className="px-4 py-2 text-neutral-500 font-bold hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg">Cancelar</button>
                  <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    <Send size={18} /> PUBLICAR NOTA
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotesManager;