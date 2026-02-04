import { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Image as ImageIcon, Send, Trash2, Users, Eye, Lock, Edit2, GripHorizontal, Folder, FolderPlus, ArrowLeft, MoreVertical } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function NotesManager({ notes, connectedPlayers, currentUser, onEmitNote, onDeleteNote, onOpenNote, onClose }) {
  // --- 1. GESTIÓN DE VENTANA (Posición y Tamaño) ---
  const [position, setPosition, keepInBounds] = useWindowPosition('vtt-notes-manager', { x: 50, y: 50 });
  const [size, setSize] = useState({ w: 500, h: 600 }); // Nuevo: Estado de tamaño
  
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const startSize = useRef({ w: 0, h: 0, x: 0, y: 0 });

  // --- 2. GESTIÓN DE DATOS Y CARPETAS ---
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [currentFolderId, setCurrentFolderId] = useState('root'); // ID de la carpeta actual
  const [editingId, setEditingId] = useState(null);
  
  // Drag & Drop de items
  const [draggedItem, setDraggedItem] = useState(null);

  // Formulario
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [targets, setTargets] = useState([]);
  const fileInputRef = useRef(null);

  // --- LÓGICA DE VENTANA (Mover y Redimensionar) ---
  const handleMouseDownWindow = (e) => {
    if (e.target.closest('.no-drag')) return; // Evitar arrastrar si tocamos botones
    setIsDraggingWindow(true);
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseDownResize = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    startSize.current = { w: size.w, h: size.h, x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (isDraggingWindow) {
        setPosition(keepInBounds(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y));
      }
      if (isResizing) {
        const newW = Math.max(350, startSize.current.w + (e.clientX - startSize.current.x));
        const newH = Math.max(400, startSize.current.h + (e.clientY - startSize.current.y));
        setSize({ w: newW, h: newH });
      }
    };
    const handleUp = () => { setIsDraggingWindow(false); setIsResizing(false); };
    
    if (isDraggingWindow || isResizing) {
      window.addEventListener('mousemove', handleMove); window.addEventListener('mouseup', handleUp);
    }
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDraggingWindow, isResizing]);


  // --- LÓGICA DE FILTRADO Y CARPETAS ---
  
  // Procesamos las notas para asegurar que tienen parentId (compatibilidad hacia atrás)
  const processedNotes = notes.map(n => ({
    ...n,
    parentId: n.parentId || 'root',
    type: n.type || 'note', // 'note' o 'folder'
    order: n.order || 0
  })).sort((a, b) => a.order - b.order); // Ordenar por posición

  // Filtramos las visibles en la carpeta actual
  const currentItems = processedNotes.filter(n => {
    // Si es carpeta, la mostramos si está en este nivel
    if (n.type === 'folder') return n.parentId === currentFolderId;
    
    // Si es nota, comprobamos permisos Y nivel
    const isAuthor = n.author === currentUser.name;
    const isTarget = n.targets?.includes('ALL') || n.targets?.includes(currentUser.name);
    return n.parentId === currentFolderId && (isAuthor || isTarget);
  });

  // Encontrar nombre de carpeta actual para el título
  const currentFolderName = currentFolderId === 'root' ? 'Inicio' : notes.find(n => n.id === currentFolderId)?.title || 'Carpeta';

  // --- ACCIONES ---

  const handleCreateFolder = () => {
    const folderName = prompt("Nombre de la nueva carpeta:");
    if (!folderName) return;
    
    const newFolder = {
      id: Date.now(),
      type: 'folder',
      title: folderName,
      parentId: currentFolderId,
      author: currentUser.name,
      targets: ['ALL'], // Las carpetas suelen ser visibles, el contenido es lo que se filtra
      createdAt: Date.now(),
      order: Date.now() // Al final
    };
    onEmitNote(newFolder);
  };

  const handleCreateOrUpdate = (e) => {
    e.preventDefault();
    if (!title.trim() || (!content.trim() && !image)) return;

    const finalTargets = targets.length === 0 ? [currentUser.name] : targets;
    const noteData = {
      id: editingId || Date.now(),
      type: 'note',
      parentId: editingId ? (notes.find(n=>n.id===editingId)?.parentId || currentFolderId) : currentFolderId,
      title, content, image,
      author: currentUser.name,
      targets: finalTargets,
      createdAt: editingId ? (notes.find(n=>n.id===editingId)?.createdAt || Date.now()) : Date.now(),
      order: editingId ? (notes.find(n=>n.id===editingId)?.order || 0) : Date.now()
    };

    onEmitNote(noteData);
    if (!editingId) onOpenNote(noteData); // Abrir solo si es nueva
    resetForm();
  };

  const resetForm = () => { setTitle(''); setContent(''); setImage(''); setTargets([]); setEditingId(null); setView('list'); };

  const handleEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setImage(note.image || '');
    setTargets(note.targets || []);
    setView('create');
  };

  // --- DRAG & DROP (Organización) ---
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    // Hack para ocultar imagen fantasma si quisieras, o dejarla por defecto
  };

  const handleDragOver = (e, targetItem) => {
    e.preventDefault(); // Necesario para permitir drop
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetItem.id) return;

    // CASO 1: Soltar sobre una CARPETA -> Mover dentro
    if (targetItem.type === 'folder' && draggedItem.type !== 'folder') {
      const updatedItem = { ...draggedItem, parentId: targetItem.id };
      onEmitNote(updatedItem);
    } 
    // CASO 2: Soltar sobre otro ITEM -> Intercambiar orden (Reordenar)
    else {
      // Intercambiamos los valores de 'order'
      const newOrderForDragged = targetItem.order;
      const newOrderForTarget = draggedItem.order;

      const updatedDragged = { ...draggedItem, order: newOrderForDragged };
      const updatedTarget = { ...targetItem, order: newOrderForTarget };

      onEmitNote(updatedDragged);
      onEmitNote(updatedTarget);
    }
    setDraggedItem(null);
  };


  // --- RENDERIZADO ---
  const isPrivate = targets.length === 0 || (targets.length === 1 && targets[0] === currentUser.name);

  return (
    <div 
      style={{ left: position.x, top: position.y, width: size.w, height: size.h }} 
      className="fixed z-[100] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in duration-200"
    >
        {/* Cabecera Arrastrable */}
        <div onMouseDown={handleMouseDownWindow} className="bg-neutral-100 dark:bg-neutral-800 p-3 flex justify-between items-center cursor-grab active:cursor-grabbing border-b border-neutral-200 dark:border-white/10 select-none">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 font-bold truncate pr-4">
             <GripHorizontal size={18} /> 
             <span className="truncate">Notas / {currentFolderName}</span>
          </div>
          <button onClick={onClose} onMouseDown={e=>e.stopPropagation()} className="p-1 hover:bg-red-500 hover:text-white rounded-full transition-colors no-drag"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-neutral-900 relative">
          {view === 'list' ? (
            <>
              {/* Barra de Herramientas */}
              <div className="p-3 border-b border-neutral-100 dark:border-white/5 flex gap-2 items-center">
                {currentFolderId !== 'root' && (
                  <button 
                    onClick={() => {
                        // Buscar el padre de la carpeta actual para subir un nivel
                        const currentFolderObj = notes.find(n => n.id === currentFolderId);
                        setCurrentFolderId(currentFolderObj?.parentId || 'root');
                    }} 
                    className="p-2 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-lg text-neutral-600 dark:text-neutral-300"
                    title="Atrás"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                
                <button onClick={() => { resetForm(); setView('create'); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors">
                  <Plus size={16}/> Nueva Nota
                </button>
                
                <button onClick={handleCreateFolder} className="p-2 bg-neutral-100 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-neutral-600 dark:text-neutral-300 hover:text-indigo-600 rounded-lg transition-colors" title="Crear Carpeta">
                  <FolderPlus size={18} />
                </button>
              </div>

              {/* Lista de Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {currentItems.length === 0 ? (
                  <div className="text-center text-neutral-400 mt-10 text-sm italic">Carpeta vacía.</div>
                ) : (
                  currentItems.map(item => {
                    const isFolder = item.type === 'folder';
                    const isMine = item.author === currentUser.name;

                    return (
                      <div 
                        key={item.id} 
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={(e) => handleDragOver(e, item)}
                        onDrop={(e) => handleDrop(e, item)}
                        className={`
                          relative group flex items-center gap-3 p-3 rounded-xl border transition-all select-none
                          ${isFolder ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-white dark:bg-white/5 border-neutral-100 dark:border-white/5'}
                          hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-sm cursor-grab active:cursor-grabbing
                        `}
                      >
                        {/* Icono Tipo */}
                        <div className={`shrink-0 ${isFolder ? 'text-indigo-500' : 'text-neutral-400'}`}>
                           {isFolder ? <Folder size={20} fill="currentColor" className="opacity-20"/> : (item.image ? <ImageIcon size={18}/> : <Edit2 size={18}/>)}
                        </div>
                        
                        {/* Texto */}
                        <div 
                            className="flex-1 min-w-0 cursor-pointer" 
                            onClick={() => isFolder ? setCurrentFolderId(item.id) : onOpenNote(item)}
                        >
                          <h3 className="font-bold text-neutral-800 dark:text-white text-sm truncate">
                            {item.title}
                          </h3>
                          {!isFolder && (
                              <p className="text-xs text-neutral-400 truncate mt-0.5">
                                {isMine ? 'Mía' : item.author} • {item.targets.includes('ALL') ? 'Todos' : 'Privada'}
                              </p>
                          )}
                        </div>

                        {/* Botones de Acción (Iconos Neutros) */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                           {!isFolder && (
                               <button 
                                onClick={(e) => { e.stopPropagation(); onOpenNote(item); }} 
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors" 
                                title="Ver"
                               >
                                <Eye size={16}/>
                               </button>
                           )}
                           
                           {isMine && (
                             <>
                               {/* Editar (si es carpeta solo renombra, si es nota edita) */}
                               <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(isFolder) {
                                        const newT = prompt("Nuevo nombre:", item.title);
                                        if(newT) onEmitNote({...item, title: newT});
                                    } else {
                                        handleEdit(item);
                                    }
                                }} 
                                className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors" 
                                title="Editar"
                               >
                                <Edit2 size={16}/>
                               </button>
                               
                               <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm('¿Borrar permanentemente?')) onDeleteNote(item.id); }} 
                                className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                                title="Borrar"
                               >
                                <Trash2 size={16}/>
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            // VISTA CREAR / EDITAR
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-white/5">
                    <h3 className="font-bold text-lg dark:text-white">{editingId ? 'Editar Nota' : 'Crear Nota'}</h3>
                    <button type="button" onClick={() => setView('list')} className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline">Cancelar</button>
                </div>
                
                <input autoFocus type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título..." className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white font-bold" />
                
                <textarea rows={10} value={content} onChange={e => setContent(e.target.value)} placeholder="Contenido (Markdown soportado)..." className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none text-sm font-mono leading-relaxed" />
                
                <div className="flex gap-2 items-center">
                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-2 bg-neutral-100 dark:bg-white/5 rounded border border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-500"><ImageIcon size={18} /></button>
                    <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="URL imagen (opcional)..." className="flex-1 p-2 bg-transparent border-b border-neutral-200 dark:border-white/10 outline-none text-xs dark:text-white" />
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e)=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onloadend=()=>setImage(r.result);r.readAsDataURL(f)}}} />
                </div>
                {image && <img src={image} alt="Preview" className="h-20 rounded object-cover border border-neutral-200 dark:border-white/10" />}

                <div className="bg-neutral-50 dark:bg-white/5 p-3 rounded-lg border border-neutral-100 dark:border-white/5">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Visibilidad:</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setTargets([])} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isPrivate ? 'bg-neutral-800 text-white dark:bg-white dark:text-black' : 'bg-white dark:bg-transparent text-neutral-500 border-neutral-200 dark:border-white/10'}`}><Lock size={10} className="inline mr-1"/> Solo yo</button>
                    <button type="button" onClick={() => { if(targets.includes('ALL')) setTargets([]); else setTargets(['ALL']); }} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${targets.includes('ALL') ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-transparent text-neutral-500 border-neutral-200 dark:border-white/10'}`}>TODOS</button>
                    {connectedPlayers.filter(p => p.name !== currentUser.name).map(p => {
                       const isActive = targets.includes(p.name);
                       return (
                        <button key={p.name} type="button" onClick={() => { 
                            if(isActive) setTargets(targets.filter(t=>t!==p.name)); 
                            else setTargets([...targets.filter(t=>t!=='ALL'), p.name]); 
                        }} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${isActive ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white dark:bg-transparent text-neutral-500 border-neutral-200 dark:border-white/10'}`}>{p.name}</button>
                       );
                    })}
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"><Send size={18} /> {isPrivate ? 'GUARDAR' : 'COMPARTIR'}</button>
              </form>
            </div>
          )}

          {/* TIRADOR DE RESIZE (Esquina inferior derecha) */}
          <div 
            onMouseDown={handleMouseDownResize}
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 z-50 opacity-50 hover:opacity-100"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-neutral-400 dark:border-neutral-500"></div>
          </div>
        </div>
    </div>
  );
}

export default NotesManager;