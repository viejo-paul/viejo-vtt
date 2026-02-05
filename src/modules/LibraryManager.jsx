import { useState, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { X, Plus, Search, Folder, Image as ImageIcon, FileText, Lock, Eye, Trash2, Save, MoreVertical, Layout, GripHorizontal } from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition'; // Importamos el hook de posición

function LibraryManager({ library, connectedPlayers, currentUser, onEmitResource, onUpdateResource, onDeleteResource, onOpenResource, onClose }) {
  const [view, setView] = useState('list');
  const [selectedFolder, setSelectedFolder] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- LOGICA DE POSICIÓN Y ARRASTRE ---
  // Posición inicial un poco centrada pero desplazada para que se vea que flota
  const [position, setPosition] = useWindowPosition('vtt-library-pos', { x: 80, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    // Evitamos arrastrar si pulsamos en botones, inputs o el sidebar
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag')) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault(); // Evitar scroll en móviles mientras arrastras
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


  // Estado del Editor
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'text',
    title: '',
    content: '',
    folder: 'General',
    visibility: 'visible',
    attachment: ''
  });

  // 1. GESTIÓN DE CARPETAS
  const folders = useMemo(() => {
    const defaultFolders = ['Todas', 'General', 'Mapas', 'PNJs', 'Pistas', 'Reglas'];
    const usedFolders = library.map(item => item.folder).filter(Boolean);
    return Array.from(new Set([...defaultFolders, ...usedFolders])).sort();
  }, [library]);

  // 2. FILTRADO
  const filteredItems = library.filter(item => {
    if (selectedFolder !== 'Todas' && item.folder !== selectedFolder) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    const isAuthor = item.author === currentUser.name;
    const isGM = currentUser.isGM;
    if (item.visibility === 'hidden' && !isAuthor && !isGM) return false;

    return true;
  });

  // --- ACCIONES ---
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

  // ESTILOS DE LA VENTANA
  // Eliminamos "fixed inset-0 bg-black/60" para quitar el modal bloqueante
  // Añadimos style={{ left, top }} y width fijo
  return (
    <div 
      style={{ left: position.x, top: position.y }}
      className="fixed z-[90] w-[95vw] md:w-[900px] h-[80vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200 dark:border-white/10 animate-in fade-in zoom-in duration-200"
    >
      
        {/* === SIDEBAR + AREA PRINCIPAL === */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* SIDEBAR (CARPETAS) */}
            {/* Añadimos clase 'no-drag' para que si clicas aquí no se mueva la ventana entera */}
            <div className="w-64 bg-neutral-100 dark:bg-black/40 border-r border-neutral-200 dark:border-white/10 flex flex-col hidden md:flex no-drag">
                <div 
                  onMouseDown={handleStart} onTouchStart={handleStart}
                  className="p-4 border-b border-neutral-200 dark:border-white/10 cursor-move hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <h2 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2 pointer-events-none">
                    <Layout size={18} className="text-emerald-600"/> Biblioteca
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {folders.map(folder => (
                    <button
                        key={folder}
                        onClick={() => { setSelectedFolder(folder); setView('list'); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${selectedFolder === folder ? 'bg-white dark:bg-white/10 shadow-sm font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <Folder size={16} className={selectedFolder === folder ? 'fill-emerald-100 dark:fill-emerald-900' : ''} />
                        {folder}
                    </button>
                    ))}
                </div>
                <div className="p-4 border-t border-neutral-200 dark:border-white/10 text-xs text-neutral-400 text-center">
                    {library.length} recursos totales
                </div>
            </div>

            {/* ÁREA DERECHA */}
            <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
            
                {/* HEADER PRINCIPAL (ZONA DE ARRASTRE) */}
                <div 
                    onMouseDown={handleStart} onTouchStart={handleStart}
                    className="h-16 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between px-4 cursor-move select-none hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3 flex-1">
                        <button className="md:hidden no-drag" onClick={() => {/* Toggle Sidebar Mobile */}}><Folder/></button>
                        
                        {/* Icono de agarre visual */}
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

                {/* CONTENIDO (LISTA O EDITOR) */}
                {/* Nota: Usamos 'no-drag' o simplemente dejamos que el evento onMouseDown no se propague desde los hijos si fuera necesario, pero como handleStart filtra por inputs/buttons, suele funcionar bien */}
                
                {/* === VISTA: LISTA === */}
                {view === 'list' && (
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar cursor-default">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredItems.map(item => (
                        <div key={item.id} className="group relative bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-4 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col">
                            {/* ... Contenido de la tarjeta ... */}
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
                            <div className="flex gap-2 mt-auto">
                                <button onClick={() => onOpenResource(item)} className="flex-1 bg-neutral-100 dark:bg-white/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-neutral-700 dark:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Eye size={14}/> ABRIR
                                </button>
                                {(item.author === currentUser.name || currentUser.isGM) && (
                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="px-3 bg-neutral-100 dark:bg-white/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-neutral-600 dark:text-white rounded-lg transition-colors">
                                        <MoreVertical size={14}/>
                                    </button>
                                )}
                            </div>
                        </div>
                        ))}
                        {filteredItems.length === 0 && <div className="col-span-full text-center py-10 text-neutral-400 italic">No hay recursos en esta carpeta.</div>}
                    </div>
                    </div>
                )}

                {/* === VISTA: EDITOR === */}
                {view === 'editor' && (
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-neutral-50 dark:bg-black/20 cursor-default">
                        {/* El formulario es igual que antes, solo asegúrate de importar ReactQuill de 'react-quill-new' */}
                        <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Título</label>
                                    <input autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Carpeta</label>
                                    <input type="text" list="folder-suggestions" value={formData.folder} onChange={e => setFormData({...formData, folder: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                                    <datalist id="folder-suggestions">{folders.map(f => <option key={f} value={f} />)}</datalist>
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
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">URL Imagen</label>
                                    <input type="text" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white font-mono text-sm" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen Cabecera</label>
                                        <input type="text" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white text-sm" />
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