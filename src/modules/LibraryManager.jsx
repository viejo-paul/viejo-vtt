import { useState, useMemo } from 'react';
import ReactQuill from 'react-quill-new'; // <--- CAMBIO AQUÍ
import 'react-quill-new/dist/quill.snow.css'; // <--- CAMBIO AQUÍ
import { X, Plus, Search, Folder, Image as ImageIcon, FileText, Lock, Eye, Trash2, Save, MoreVertical, Layout } from 'lucide-react';

function LibraryManager({ library, connectedPlayers, currentUser, onEmitResource, onUpdateResource, onDeleteResource, onOpenResource, onClose }) {
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [selectedFolder, setSelectedFolder] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del Editor
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    type: 'text', // 'text' | 'image'
    title: '',
    content: '', // HTML para texto o URL para imagen
    folder: 'General',
    visibility: 'visible', // 'hidden' | 'visible'
    attachment: '' // URL imagen adjunta para textos
  });

  // 1. GESTIÓN DE CARPETAS
  const folders = useMemo(() => {
    const defaultFolders = ['Todas', 'General', 'Mapas', 'PNJs', 'Pistas', 'Reglas'];
    const usedFolders = library.map(item => item.folder).filter(Boolean);
    return Array.from(new Set([...defaultFolders, ...usedFolders])).sort();
  }, [library]);

  // 2. FILTRADO DE LISTA
  const filteredItems = library.filter(item => {
    // Filtro por carpeta
    if (selectedFolder !== 'Todas' && item.folder !== selectedFolder) return false;
    // Filtro por búsqueda
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Filtro de Seguridad
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex border border-neutral-200 dark:border-white/10">
        
        {/* === SIDEBAR (CARPETAS) === */}
        <div className="w-64 bg-neutral-100 dark:bg-black/40 border-r border-neutral-200 dark:border-white/10 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-neutral-200 dark:border-white/10">
            <h2 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2">
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

        {/* === ÁREA PRINCIPAL === */}
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
          
          {/* HEADER PRINCIPAL */}
          <div className="h-16 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 flex-1">
              <button className="md:hidden" onClick={() => {/* Toggle Sidebar Mobile */}}><Folder/></button>
              <h3 className="font-bold text-lg dark:text-white">{view === 'list' ? selectedFolder : (editingId ? 'Editar Recurso' : 'Nuevo Recurso')}</h3>
              
              {view === 'list' && (
                <div className="relative max-w-xs flex-1 ml-4 hidden sm:block">
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
            
            <div className="flex items-center gap-2">
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

          {/* === VISTA: LISTA === */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} className="group relative bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-4 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col">
                    
                    {/* Badge de Tipo */}
                    <div className="flex justify-between items-start mb-2">
                      <span className={`p-1.5 rounded-md ${item.type === 'image' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {item.type === 'image' ? <ImageIcon size={16}/> : <FileText size={16}/>}
                      </span>
                      {item.visibility === 'hidden' && <Lock size={14} className="text-red-400" title="Oculto (Draft)"/>}
                    </div>

                    {/* Título e Info */}
                    <h4 className="font-bold text-neutral-800 dark:text-white truncate mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 flex-1">
                      {item.type === 'image' ? 'Recurso de Imagen' : 'Documento de Texto'} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>

                    {/* Botones de Acción */}
                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => onOpenResource(item)}
                        className="flex-1 bg-neutral-100 dark:bg-white/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-neutral-700 dark:text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Eye size={14}/> ABRIR
                      </button>
                      {(item.author === currentUser.name || currentUser.isGM) && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                          className="px-3 bg-neutral-100 dark:bg-white/10 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-neutral-600 dark:text-white rounded-lg transition-colors"
                        >
                          <MoreVertical size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && (
                  <div className="col-span-full text-center py-10 text-neutral-400 italic">
                    No hay recursos en esta carpeta.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === VISTA: EDITOR === */}
          {view === 'editor' && (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-neutral-50 dark:bg-black/20">
              <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-6">
                
                {/* 1. Datos Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Título</label>
                    <input autoFocus type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Carpeta</label>
                    <input type="text" list="folder-suggestions" value={formData.folder} onChange={e => setFormData({...formData, folder: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
                    <datalist id="folder-suggestions">
                      {folders.map(f => <option key={f} value={f} />)}
                    </datalist>
                  </div>
                </div>

                {/* 2. Tipo y Visibilidad */}
                <div className="flex gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Tipo de Recurso</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({...formData, type: 'text'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.type === 'text' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}>Texto / Nota</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'image'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${formData.type === 'image' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}>Imagen</button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Visibilidad</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({...formData, visibility: 'hidden'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'hidden' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}><Lock size={14}/> Oculto (Draft)</button>
                      <button type="button" onClick={() => setFormData({...formData, visibility: 'visible'})} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'visible' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-transparent border-neutral-200 text-neutral-500'}`}><Eye size={14}/> Público</button>
                    </div>
                  </div>
                </div>

                {/* 3. Contenido Específico */}
                {formData.type === 'image' ? (
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">URL de la Imagen</label>
                    <input type="text" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} placeholder="https://..." className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white font-mono text-sm" />
                    {formData.content && (
                      <div className="mt-4 border-2 border-dashed border-neutral-300 dark:border-white/10 rounded-xl p-4 flex justify-center bg-black/50">
                        <img src={formData.content} alt="Preview" className="max-h-64 object-contain shadow-lg" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                     {/* Imagen adjunta para texto */}
                     <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen de Cabecera (Opcional)</label>
                        <input type="text" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} placeholder="URL de imagen para decorar la nota..." className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white text-sm" />
                     </div>
                     {/* Editor Quill (NUEVO) */}
                     <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white">
                        <ReactQuill 
                          theme="snow" 
                          value={formData.content} 
                          onChange={value => setFormData({...formData, content: value})} 
                          modules={quillModules}
                          className="h-64 mb-12"
                        />
                     </div>
                  </div>
                )}

                {/* Botonera Guardar */}
                <div className="flex gap-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                  {editingId && (
                    <button type="button" onClick={handleDelete} className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
                      <Trash2 size={18} /> Borrar
                    </button>
                  )}
                  <div className="flex-1"></div>
                  <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Save size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Recurso'}
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

export default LibraryManager;