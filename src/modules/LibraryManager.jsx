import { useState, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  X, Plus, Search, Folder, Image as ImageIcon, FileText, Lock, Eye, 
  Trash2, Save, Edit2, Layout, GripHorizontal, Upload, Settings, 
  ChevronUp, ChevronDown, CheckSquare, XSquare 
} from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

function LibraryManager({ library, connectedPlayers, currentUser, onEmitResource, onUpdateResource, onDeleteResource, onOpenResource, onClose }) {
  const [view, setView] = useState('list');
  const [selectedFolder, setSelectedFolder] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- LOGICA DE POSICIÓN Y ARRASTRE ---
  const [position, setPosition] = useWindowPosition('vtt-library-pos', { x: 80, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y });
    };
    const handleEnd = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, setPosition]);

  // --- GESTIÓN DE CARPETAS AVANZADA ---
  const [customFolders, setCustomFolders] = useState(() => {
    const saved = localStorage.getItem('vtt-custom-folders');
    return saved ? JSON.parse(saved) : ['General', 'Mapas', 'PNJs', 'Pistas', 'Reglas'];
  });
  const [isManagingFolders, setIsManagingFolders] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Sincronizar carpetas existentes en la librería que no estén en la lista custom
  useEffect(() => {
    const usedFolders = [...new Set(library.map(i => i.folder).filter(Boolean))];
    let updated = [...customFolders];
    let changed = false;
    usedFolders.forEach(f => {
      if (!updated.includes(f)) {
        updated.push(f);
        changed = true;
      }
    });
    if (changed) {
      setCustomFolders(updated);
      localStorage.setItem('vtt-custom-folders', JSON.stringify(updated));
    }
  }, [library]);

  const saveFolders = (newList) => {
    setCustomFolders(newList);
    localStorage.setItem('vtt-custom-folders', JSON.stringify(newList));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    if (customFolders.includes(newFolderName)) return alert('Esa carpeta ya existe');
    saveFolders([...customFolders, newFolderName]);
    setNewFolderName('');
  };

  const handleDeleteFolder = (folderName) => {
    if (folderName === 'General') return alert('No puedes borrar la carpeta General');
    if (!confirm(`¿Borrar carpeta "${folderName}" y TODO su contenido? Esta acción no se puede deshacer.`)) return;

    // 1. Borrar recursos
    const itemsToDelete = library.filter(i => i.folder === folderName);
    itemsToDelete.forEach(item => onDeleteResource(item.id));

    // 2. Borrar carpeta de la lista
    const newList = customFolders.filter(f => f !== folderName);
    saveFolders(newList);
    setSelectedFolder('General');
  };

  const handleRenameFolder = (oldName) => {
    const newName = prompt("Nuevo nombre para la carpeta:", oldName);
    if (!newName || newName === oldName) return;
    if (customFolders.includes(newName)) return alert('Ya existe una carpeta con ese nombre');

    // 1. Actualizar lista carpetas
    const newList = customFolders.map(f => f === oldName ? newName : f);
    saveFolders(newList);

    // 2. Actualizar recursos (Batch Update)
    const itemsToMove = library.filter(i => i.folder === oldName);
    itemsToMove.forEach(item => {
      onUpdateResource(item.id, { folder: newName });
    });
    
    if (selectedFolder === oldName) setSelectedFolder(newName);
  };

  const moveFolder = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === customFolders.length - 1) return;
    
    const newList = [...customFolders];
    const temp = newList[index];
    newList[index] = newList[index + direction];
    newList[index + direction] = temp;
    saveFolders(newList);
  };


  // --- ESTADO DEL EDITOR Y SUBIDA ---
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'text',
    title: '',
    content: '',
    folder: 'General',
    visibility: 'visible',
    attachment: ''
  });

  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); 

  const handleTriggerUpload = (target) => {
    setUploadTarget(target);
    fileInputRef.current.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("⚠️ La imagen es demasiado grande (>1MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setFormData(prev => ({ ...prev, [uploadTarget]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // FILTRADO
  const filteredItems = library.filter(item => {
    if (selectedFolder !== 'Todas' && item.folder !== selectedFolder) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    const isAuthor = item.author === currentUser.name;
    const isGM = currentUser.isGM;
    if (item.visibility === 'hidden' && !isAuthor && !isGM) return false;

    return true;
  });

  // --- ACCIONES RECURSOS ---
  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      type: 'text',
      title: '',
      content: '',
      folder: selectedFolder === 'Todas' ? 'General' : selectedFolder,
      visibility: 'hidden',
      attachment: ''
    });
    setView('editor');
  };

  const handleEdit = (item) => {
    if (item.author !== currentUser.name && !currentUser.isGM) return;
    setEditingId(item.id);
    setFormData({
      type: item.type,
      title: item.title,
      content: item.content,
      folder: item.folder,
      visibility: item.visibility,
      attachment: item.attachment || ''
    });
    setView('editor');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("El título es obligatorio");
    const resourceData = {
      ...formData,
      id: editingId || Date.now(),
      author: editingId ? (library.find(i => i.id === editingId)?.author || currentUser.name) : currentUser.name,
      createdAt: editingId ? (library.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(),
      updatedAt: Date.now()
    };
    onEmitResource(resourceData);
    setView('list');
  };

  const handleDelete = () => {
    if (confirm('¿Seguro que quieres borrar este recurso permanentemente?')) {
      onDeleteResource(editingId);
      setView('list');
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ],
  };

  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className="fixed z-[90] w-[95vw] md:w-[900px] h-[80vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200 dark:border-white/10 animate-in fade-in zoom-in duration-200"
    >
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

      <div className="flex flex-1 overflow-hidden">
            
        {/* === SIDEBAR (CARPETAS) === */}
        <div className="w-64 bg-neutral-100 dark:bg-black/40 border-r border-neutral-200 dark:border-white/10 flex flex-col hidden md:flex no-drag">
          <div 
            onMouseDown={handleStart} onTouchStart={handleStart}
            className="p-4 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center cursor-move"
          >
            <h2 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2 pointer-events-none">
              <Layout size={18} className="text-emerald-600"/> Biblioteca
            </h2>
            <button 
              onClick={() => setIsManagingFolders(!isManagingFolders)}
              className={`p-1.5 rounded-lg transition-colors ${isManagingFolders ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-black/10 text-neutral-400'}`}
              title="Gestionar Carpetas"
            >
              <Settings size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => { setSelectedFolder('Todas'); setView('list'); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedFolder === 'Todas' ? 'bg-white dark:bg-white/10 shadow-sm font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              <Folder size={16} /> Todas
            </button>

            <div className="my-2 border-t border-black/5 dark:border-white/5"></div>

            {customFolders.map((folder, idx) => (
              <div key={folder} className="group relative flex items-center">
                <button
                  onClick={() => { setSelectedFolder(folder); setView('list'); }}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedFolder === folder ? 'bg-white dark:bg-white/10 shadow-sm font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <Folder size={16} className={selectedFolder === folder ? 'fill-emerald-100 dark:fill-emerald-900' : ''} />
                  <span className="truncate max-w-[120px]">{folder}</span>
                </button>
                
                {isManagingFolders && folder !== 'General' && (
                  <div className="absolute right-1 flex gap-1 bg-neutral-100 dark:bg-neutral-900 shadow-sm p-1 rounded">
                    <button onClick={() => moveFolder(idx, -1)} className="p-1 hover:text-emerald-500"><ChevronUp size={12}/></button>
                    <button onClick={() => moveFolder(idx, 1)} className="p-1 hover:text-emerald-500"><ChevronDown size={12}/></button>
                    <button onClick={() => handleRenameFolder(folder)} className="p-1 hover:text-blue-500"><Edit2 size={12}/></button>
                    <button onClick={() => handleDeleteFolder(folder)} className="p-1 hover:text-red-500"><Trash2 size={12}/></button>
                  </div>
                )}
              </div>
            ))}

            {isManagingFolders && (
              <div className="mt-2 px-2">
                <div className="flex gap-1">
                  <input 
                    type="text" 
                    placeholder="Nueva carpeta..." 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-white/20 bg-white dark:bg-black/20 dark:text-white"
                  />
                  <button onClick={handleCreateFolder} disabled={!newFolderName} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ÁREA DERECHA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
          
          <div 
            onMouseDown={handleStart} onTouchStart={handleStart}
            className="h-16 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between px-4 cursor-move select-none hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <button className="md:hidden no-drag" onClick={() => {/* Toggle Sidebar */}}><Folder/></button>
              <GripHorizontal className="text-neutral-300 dark:text-neutral-600 mr-2" />
              <h3 className="font-bold text-lg dark:text-white pointer-events-none">
                  {view === 'list' ? selectedFolder : (editingId ? 'Editar Recurso' : 'Nuevo Recurso')}
              </h3>
              
              {view === 'list' && (
                  <div className="relative max-w-xs flex-1 ml-4 hidden sm:block no-drag">
                  <Search size={14} className="absolute top-3 left-3 text-neutral-400"/>
                  <input 
                      type="text" 
                      placeholder="Buscar..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-black/20 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                  </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 no-drag">
              {view === 'list' ? (
                  <button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
                  <Plus size={16}/> <span className="hidden sm:inline">Nuevo</span>
                  </button>
              ) : (
                  <button onClick={() => setView('list')} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-3 py-2 font-bold text-sm">
                  Cancelar
                  </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-white/10 rounded-full text-neutral-400 hover:text-red-500">
                  <X size={20} />
              </button>
            </div>
          </div>

          {/* CONTENIDO */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar cursor-default">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} className="group relative bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-4 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`p-1.5 rounded-md ${item.type === 'image' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {item.type === 'image' ? <ImageIcon size={16}/> : <FileText size={16}/>}
                      </span>
                      {item.visibility === 'hidden' && <Lock size={14} className="text-red-400" title="Oculto (Draft)"/>}
                    </div>
                    
                    <h4 className="font-bold text-neutral-800 dark:text-white truncate mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 flex-1">
                      {item.type === 'image' ? 'Recurso de Imagen' : 'Documento de Texto'} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    
                    {/* BOTONERA ACTUALIZADA */}
                    <div className="flex gap-3 mt-auto">
                      <button 
                        onClick={() => onOpenResource(item)} 
                        className="flex-1 bg-neutral-100 dark:bg-white/10 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Eye size={16}/> MOSTRAR
                      </button>
                      {(item.author === currentUser.name || currentUser.isGM) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(item); }} 
                          className="flex-1 bg-neutral-100 dark:bg-white/10 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <Edit2 size={16}/> EDITAR
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && <div className="col-span-full text-center py-10 text-neutral-400 italic">No hay recursos en esta carpeta.</div>}
              </div>
            </div>
          )}

          {view === 'editor' && (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-neutral-50 dark:bg-black/20 cursor-default">
              <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Título</label>
                    <input autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Carpeta</label>
                    {/* Usamos un select en vez de input libre para forzar consistencia */}
                    <select 
                      value={formData.folder} 
                      onChange={e => setFormData({...formData, folder: e.target.value})} 
                      className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    >
                      {customFolders.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Tipo</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, type: 'text'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.type === 'text' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}>Texto</button>
                        <button type="button" onClick={() => setFormData({...formData, type: 'image'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.type === 'image' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}>Imagen</button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Visibilidad</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setFormData({...formData, visibility: 'hidden'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'hidden' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}><Lock size={14}/> Oculto</button>
                        <button type="button" onClick={() => setFormData({...formData, visibility: 'visible'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'visible' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}><Eye size={14}/> Público</button>
                    </div>
                  </div>
                </div>

                {formData.type === 'image' ? (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen (URL o Subir)</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="flex-1 p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white font-mono text-sm" placeholder="https://..." />
                      <button type="button" onClick={() => handleTriggerUpload('content')} className="px-3 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 rounded-lg transition-colors" title="Subir imagen"><Upload size={18}/></button>
                    </div>
                    {formData.content && (
                      <div className="mt-4 border-2 border-dashed border-neutral-300 dark:border-white/10 rounded-xl p-4 flex justify-center bg-black/50">
                        <img src={formData.content} alt="Preview" className="max-h-64 object-contain shadow-lg" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen Cabecera</label>
                      <div className="flex gap-2">
                        <input type="text" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} className="flex-1 p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white text-sm" />
                        <button type="button" onClick={() => handleTriggerUpload('attachment')} className="px-3 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 rounded-lg transition-colors" title="Subir imagen"><Upload size={18}/></button>
                      </div>
                      {formData.attachment && (
                          <div className="mt-2 h-20 w-full overflow-hidden rounded bg-black/50 relative">
                            <img src={formData.attachment} className="w-full h-full object-cover opacity-70" alt="header preview"/>
                          </div>
                      )}
                    </div>
                    <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white">
                      <ReactQuill theme="snow" value={formData.content} onChange={value => setFormData({...formData, content: value})} modules={quillModules} className="h-64 mb-12" />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                  {editingId && <button type="button" onClick={handleDelete} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2"><Trash2 size={18} /> Borrar</button>}
                  <div className="flex-1"></div>
                  <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2"><Save size={18} /> Guardar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LibraryManager;