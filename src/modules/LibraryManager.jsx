import { useState, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  X, Plus, Search, Folder, Image as ImageIcon, FileText, Lock, Eye, 
  Trash2, Save, Edit2, Layout, GripHorizontal, Upload, Settings, 
  ChevronUp, ChevronDown, ChevronRight, CornerDownRight, Music, File, Users, Palette, Maximize 
} from 'lucide-react';
import { useWindowPosition } from '../hooks/useWindowPosition';

// Colores disponibles para las notas
const NOTE_COLORS = [
  { id: 'default', bg: 'bg-white dark:bg-neutral-800', border: 'border-neutral-200 dark:border-white/10' },
  { id: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700/50' },
  { id: 'red', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-700/50' },
  { id: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700/50' },
  { id: 'green', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700/50' },
  { id: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700/50' },
  { id: 'dark', bg: 'bg-neutral-900 text-white', border: 'border-neutral-700' },
];

function LibraryManager({ library, connectedPlayers, currentUser, onEmitResource, onUpdateResource, onDeleteResource, onOpenResource, openResources = [], onClose }) {
    const [view, setView] = useState('list');
  const [selectedFolder, setSelectedFolder] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Posición
  const [position, setPosition] = useWindowPosition('vtt-library-pos', { x: 80, y: 60 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleStartWindowDrag = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag') || e.target.closest('.draggable-item')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDraggingWindow(true);
    dragOffset.current = { x: clientX - position.x, y: clientY - position.y };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDraggingWindow) return;
      e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition({ x: clientX - dragOffset.current.x, y: clientY - dragOffset.current.y });
    };
    const handleEnd = () => setIsDraggingWindow(false);
    if (isDraggingWindow) {
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
  }, [isDraggingWindow, setPosition]);


  // Carpetas
  const [customFolders, setCustomFolders] = useState(() => {
    const saved = localStorage.getItem('vtt-custom-folders');
    return saved ? JSON.parse(saved) : ['General', 'Mapas', 'PNJs', 'Pistas', 'Reglas'];
  });
  const [isManagingFolders, setIsManagingFolders] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({ 'General': true });

  const itemsByFolder = useMemo(() => {
    const groups = {};
    library.forEach(item => {
      if (!groups[item.folder]) groups[item.folder] = [];
      groups[item.folder].push(item);
    });
    return groups;
  }, [library]);

  const toggleFolder = (folderName) => setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  
  // Drag Items
  const handleItemDragStart = (e, itemId) => { e.stopPropagation(); e.dataTransfer.setData("text/plain", itemId); e.dataTransfer.effectAllowed = "move"; };
  const handleFolderDragOver = (e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; e.currentTarget.classList.add('bg-emerald-100', 'dark:bg-emerald-900/30'); };
  const handleFolderDragLeave = (e) => e.currentTarget.classList.remove('bg-emerald-100', 'dark:bg-emerald-900/30');
  const handleFolderDrop = (e, targetFolder) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-emerald-100', 'dark:bg-emerald-900/30'); const itemId = e.dataTransfer.getData("text/plain"); if (!itemId) return; const item = library.find(i => i.id.toString() === itemId); if (item && item.folder !== targetFolder) { onUpdateResource(item.id, { folder: targetFolder }); setExpandedFolders(prev => ({ ...prev, [targetFolder]: true })); } };

  // Sync Carpetas
  useEffect(() => { const usedFolders = [...new Set(library.map(i => i.folder).filter(Boolean))]; let updated = [...customFolders]; let changed = false; usedFolders.forEach(f => { if (!updated.includes(f)) { updated.push(f); changed = true; } }); if (changed) { setCustomFolders(updated); localStorage.setItem('vtt-custom-folders', JSON.stringify(updated)); } }, [library]);
  const saveFolders = (newList) => { setCustomFolders(newList); localStorage.setItem('vtt-custom-folders', JSON.stringify(newList)); };
  const handleCreateFolder = () => { if(!newFolderName.trim() || customFolders.includes(newFolderName)) return; saveFolders([...customFolders, newFolderName]); setNewFolderName(''); };
  const handleDeleteFolder = (folderName) => { if(folderName === 'General' || !confirm('¿Borrar carpeta?')) return; library.filter(i => i.folder === folderName).forEach(item => onDeleteResource(item.id)); saveFolders(customFolders.filter(f => f !== folderName)); setSelectedFolder('General'); };
  const handleRenameFolder = (oldName) => { const newName = prompt("Nuevo nombre:", oldName); if(!newName || customFolders.includes(newName)) return; saveFolders(customFolders.map(f => f === oldName ? newName : f)); library.filter(i => i.folder === oldName).forEach(item => onUpdateResource(item.id, { folder: newName })); if(selectedFolder === oldName) setSelectedFolder(newName); };
  const moveFolder = (index, direction) => { if ((direction === -1 && index === 0) || (direction === 1 && index === customFolders.length - 1)) return; const newList = [...customFolders]; const temp = newList[index]; newList[index] = newList[index + direction]; newList[index + direction] = temp; saveFolders(newList); };

  // EDITOR
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    type: 'text', title: '', content: '', folder: 'General', 
    visibility: 'hidden', allowedPlayers: [], attachment: '',
    colorId: 'default', // NUEVO: Color de nota
    isFrameless: false // NUEVO: Modo invisible
  });
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); 

  const allKnownPlayers = useMemo(() => {
    const currentNames = connectedPlayers.map(p => p.name);
    const authorNames = library.map(i => i.author);
    return [...new Set([...currentNames, ...authorNames])].filter(name => name !== 'GM' && name !== 'DJ' && name !== 'Narrador'); 
  }, [connectedPlayers, library]);

  const handleTriggerUpload = (target) => { setUploadTarget(target); fileInputRef.current.click(); };
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("⚠️ Archivo demasiado grande (>5MB).");
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(prev => ({ ...prev, [uploadTarget]: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const toggleAllowedPlayer = (playerName) => {
    setFormData(prev => {
      const currentList = prev.allowedPlayers || [];
      const newList = currentList.includes(playerName) ? currentList.filter(n => n !== playerName) : [...currentList, playerName];
      return { ...prev, allowedPlayers: newList, visibility: newList.length > 0 ? 'specific' : 'hidden' };
    });
  };
  const setGlobalVisibility = (mode) => setFormData(prev => ({ ...prev, visibility: mode, allowedPlayers: [] }));

  // Filtro
  const filteredItems = library.filter(item => {
    if (selectedFolder !== 'Todas' && item.folder !== selectedFolder) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    const isAuthor = item.author === currentUser.name;
    const isGM = currentUser.isGM;
    const isAllowed = item.allowedPlayers?.includes(currentUser.name);
    if (isGM || isAuthor || item.visibility === 'visible' || item.visibility === 'public' || isAllowed) return true;
    return false;
  });

  // Acciones
  const handleCreateNew = () => { setEditingId(null); setFormData({ type: 'text', title: '', content: '', folder: selectedFolder === 'Todas' ? 'General' : selectedFolder, visibility: 'hidden', allowedPlayers: [], attachment: '', colorId: 'default', isFrameless: false }); setView('editor'); };
  const handleEdit = (item) => { if (item.author !== currentUser.name && !currentUser.isGM) return; setEditingId(item.id); setFormData({ type: item.type, title: item.title, content: item.content, folder: item.folder, visibility: item.visibility, allowedPlayers: item.allowedPlayers || [], attachment: item.attachment || '', colorId: item.colorId || 'default', isFrameless: item.isFrameless || false }); setView('editor'); };
  const handleSave = (e) => { e.preventDefault(); if (!formData.title.trim()) return alert("El título es obligatorio"); const resourceData = { ...formData, id: editingId || Date.now(), author: editingId ? (library.find(i => i.id === editingId)?.author || currentUser.name) : currentUser.name, createdAt: editingId ? (library.find(i => i.id === editingId)?.createdAt || Date.now()) : Date.now(), updatedAt: Date.now() }; onEmitResource(resourceData); setView('list'); };
  const handleDelete = () => { if (confirm('¿Borrar recurso?')) { onDeleteResource(editingId); setView('list'); } };

  return (
    <div style={{ left: position.x, top: position.y }} className="fixed z-[90] w-[95vw] md:w-[900px] h-[80vh] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-neutral-200 dark:border-white/10 animate-in fade-in zoom-in duration-200">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-72 bg-neutral-100 dark:bg-black/40 border-r border-neutral-200 dark:border-white/10 flex flex-col hidden md:flex no-drag">
           <div onMouseDown={handleStartWindowDrag} onTouchStart={handleStartWindowDrag} className="p-4 border-b border-neutral-200 dark:border-white/10 flex justify-between items-center cursor-move">
            <h2 className="font-bold text-neutral-800 dark:text-white flex items-center gap-2 pointer-events-none"><Layout size={18} className="text-emerald-600"/> Biblioteca</h2>
            <button onClick={() => setIsManagingFolders(!isManagingFolders)} className={`p-1.5 rounded-lg transition-colors ${isManagingFolders ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-black/10 text-neutral-400'}`}><Settings size={14} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
             <button onClick={() => { setSelectedFolder('Todas'); setView('list'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors mb-2 ${selectedFolder === 'Todas' ? 'bg-white dark:bg-white/10 shadow-sm font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/5'}`}><Folder size={16} /> Todas</button>
             {customFolders.map((folder, idx) => {
              const itemsInThisFolder = itemsByFolder[folder] || [];
              const isExpanded = expandedFolders[folder];
              return (
                <div key={folder} className="group relative" onDragOver={handleFolderDragOver} onDragLeave={handleFolderDragLeave} onDrop={(e) => handleFolderDrop(e, folder)}>
                  <div className={`flex items-center rounded-lg transition-colors ${selectedFolder === folder ? 'bg-white dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <button onClick={() => toggleFolder(folder)} className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                    <button onClick={() => { setSelectedFolder(folder); setView('list'); }} className={`flex-1 text-left py-2 pr-2 text-sm flex items-center gap-2 truncate ${selectedFolder === folder ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-neutral-700 dark:text-neutral-300'}`}><Folder size={16} className={selectedFolder === folder ? 'fill-emerald-100 dark:fill-emerald-900' : ''} /><span className="truncate">{folder}</span></button>
                    {isManagingFolders && folder !== 'General' && (<div className="flex gap-1 pr-1"><button onClick={() => moveFolder(idx, -1)} className="p-1 text-neutral-400 hover:text-emerald-500"><ChevronUp size={12}/></button><button onClick={() => moveFolder(idx, 1)} className="p-1 text-neutral-400 hover:text-emerald-500"><ChevronDown size={12}/></button><button onClick={() => handleRenameFolder(folder)} className="p-1 text-neutral-400 hover:text-blue-500"><Edit2 size={12}/></button><button onClick={() => handleDeleteFolder(folder)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 size={12}/></button></div>)}
                  </div>
                  {isExpanded && (<div className="ml-4 pl-2 border-l border-neutral-300 dark:border-white/10 space-y-0.5 mt-0.5 mb-2">{itemsInThisFolder.map(item => (<div key={item.id} draggable="true" onDragStart={(e) => handleItemDragStart(e, item.id)} onClick={() => onOpenResource(item)} className="draggable-item flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-grab active:cursor-grabbing truncate transition-colors"><CornerDownRight size={10} className="opacity-50" />{item.type === 'image' ? <ImageIcon size={12}/> : (item.type === 'pdf' ? <File size={12}/> : <FileText size={12}/>)}<span className="truncate">{item.title}</span></div>))}{itemsInThisFolder.length === 0 && <div className="text-[10px] text-neutral-400 pl-6 py-1 italic">Vacío</div>}</div>)}
                </div>
              );
            })}
             {isManagingFolders && (<div className="mt-4 px-2 pt-4 border-t border-neutral-200 dark:border-white/10"><div className="flex gap-1"><input type="text" placeholder="Nueva carpeta..." value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full text-xs p-1.5 rounded border border-neutral-300 dark:border-white/20 bg-white dark:bg-black/20 dark:text-white"/><button onClick={handleCreateFolder} disabled={!newFolderName} className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 disabled:opacity-50"><Plus size={14} /></button></div></div>)}
          </div>
        </div>

        {/* ÁREA DERECHA */}
        <div className="flex-1 flex flex-col bg-white dark:bg-neutral-900">
          <div onMouseDown={handleStartWindowDrag} onTouchStart={handleStartWindowDrag} className="h-16 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between px-4 cursor-move select-none hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3 flex-1">
              <button className="md:hidden no-drag" onClick={() => {}}><Folder/></button>
              <GripHorizontal className="text-neutral-300 dark:text-neutral-600 mr-2" />
              <h3 className="font-bold text-lg dark:text-white pointer-events-none">{view === 'list' ? selectedFolder : (editingId ? 'Editar Recurso' : 'Nuevo Recurso')}</h3>
              {view === 'list' && (<div className="relative max-w-xs flex-1 ml-4 hidden sm:block no-drag"><Search size={14} className="absolute top-3 left-3 text-neutral-400"/><input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-black/20 rounded-full text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"/></div>)}
            </div>
            <div className="flex items-center gap-2 no-drag">
              {view === 'list' ? (<button onClick={handleCreateNew} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm"><Plus size={16}/> <span className="hidden sm:inline">Nuevo</span></button>) : (<button onClick={() => setView('list')} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white px-3 py-2 font-bold text-sm">Cancelar</button>)}
              <button onClick={onClose} className="p-2 hover:bg-red-100 dark:hover:bg-white/10 rounded-full text-neutral-400 hover:text-red-500"><X size={20} /></button>
            </div>
          </div>

          {/* LISTA */}
          {view === 'list' && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar cursor-default">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                  <div key={item.id} draggable="true" onDragStart={(e) => handleItemDragStart(e, item.id)} className="group relative bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-xl p-4 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`p-1.5 rounded-md ${item.type === 'image' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : (item.type === 'pdf' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400')}`}>
                        {item.type === 'image' ? <ImageIcon size={16}/> : (item.type === 'pdf' ? <File size={16}/> : <FileText size={16}/>)}
                      </span>
                      {item.visibility === 'hidden' ? <Lock size={14} className="text-red-400" title="Oculto"/> : (item.visibility === 'specific' ? <Users size={14} className="text-blue-400" title="Compartido"/> : <Eye size={14} className="text-emerald-400" title="Público"/>)}
                    </div>
                    <h4 className="font-bold text-neutral-800 dark:text-white truncate mb-1">{item.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 flex-1">
                      {item.type === 'image' ? 'Imagen' : (item.type === 'pdf' ? 'PDF' : 'Nota')} • {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-3 mt-auto">
                      
                      {/* BOTÓN INTELIGENTE MOSTRAR/OCULTAR */}
                      <button 
                        onClick={() => onOpenResource(item)} 
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          openResources.find(r => r.id === item.id)
                            ? 'bg-neutral-800 text-neutral-400 hover:bg-red-600 hover:text-white dark:bg-white/20' // Estado: Ocultar
                            : 'bg-neutral-100 dark:bg-white/10 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600' // Estado: Mostrar
                        }`}
                      >
                        {openResources.find(r => r.id === item.id) ? (
                          <><Eye size={16} className="opacity-50"/> OCULTAR</>
                        ) : (
                          <><Eye size={16}/> MOSTRAR</>
                        )}
                      </button>

                      {(item.author === currentUser.name || currentUser.isGM) && (
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="flex-1 bg-neutral-100 dark:bg-white/10 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all">
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

          {/* EDITOR */}
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
                    <select value={formData.folder} onChange={e => setFormData({...formData, folder: e.target.value})} className="w-full p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white">
                      {customFolders.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                {/* BLOQUE TIPO */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 p-4">
                   <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Tipo de Recurso</label>
                   <div className="flex gap-2">
                      <button type="button" onClick={() => setFormData({...formData, type: 'text'})} className={`flex-1 py-3 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${formData.type === 'text' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-transparent border-neutral-200 dark:border-white/10 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><FileText size={20}/> Texto</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'image'})} className={`flex-1 py-3 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${formData.type === 'image' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-transparent border-neutral-200 dark:border-white/10 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><ImageIcon size={20}/> Imagen</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'pdf'})} className={`flex-1 py-3 rounded-lg text-sm font-bold border flex flex-col items-center gap-1 transition-all ${formData.type === 'pdf' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-transparent border-neutral-200 dark:border-white/10 text-neutral-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><File size={20}/> PDF</button>
                      <button type="button" disabled className="flex-1 py-3 rounded-lg text-sm font-bold border border-neutral-100 dark:border-white/5 text-neutral-300 dark:text-neutral-700 flex flex-col items-center gap-1 cursor-not-allowed bg-neutral-50 dark:bg-black/20"><Music size={20}/> Música</button>
                   </div>
                   
                   {/* OPCIONES EXTRA SEGÚN TIPO */}
                   {formData.type === 'text' && (
                     <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                       <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Color de la Nota</label>
                       <div className="flex gap-2">
                         {NOTE_COLORS.map(c => (
                           <button 
                             key={c.id} 
                             type="button"
                             onClick={() => setFormData({...formData, colorId: c.id})}
                             className={`w-8 h-8 rounded-full border-2 ${c.bg} ${formData.colorId === c.id ? 'border-emerald-500 scale-110 shadow' : 'border-transparent opacity-50 hover:opacity-100'} transition-all`}
                           />
                         ))}
                       </div>
                     </div>
                   )}
                   
                   {formData.type === 'image' && (
                     <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={formData.isFrameless} onChange={e => setFormData({...formData, isFrameless: e.target.checked})} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-100 border-neutral-300 dark:bg-black/40 dark:border-white/20"/>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">Modo Ficha/Token (Sin marco ni fondo)</span>
                        </label>
                     </div>
                   )}
                </div>

                {/* BLOQUE VISIBILIDAD */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-neutral-200 dark:border-white/10 p-4">
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-3">Visibilidad</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                       <button type="button" onClick={() => setGlobalVisibility('hidden')} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'hidden' ? 'bg-red-100 border-red-300 text-red-800' : 'bg-transparent border-neutral-200 dark:border-white/10 text-neutral-500'}`}><Lock size={16}/> Oculto</button>
                       <button type="button" onClick={() => setGlobalVisibility('visible')} className={`flex-1 py-2 rounded-lg text-sm font-bold border flex items-center justify-center gap-2 ${formData.visibility === 'visible' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-transparent border-neutral-200 dark:border-white/10 text-neutral-500'}`}><Eye size={16}/> Público (Todos)</button>
                    </div>
                    <div className="border-t border-neutral-200 dark:border-white/10 pt-3">
                      <p className="text-[10px] text-neutral-400 uppercase font-bold mb-2">Compartir solo con:</p>
                      <div className="flex flex-wrap gap-2">
                        {allKnownPlayers.length === 0 && <span className="text-xs text-neutral-400 italic">No hay otros jugadores.</span>}
                        {allKnownPlayers.map(player => (
                          <button key={player} type="button" onClick={() => toggleAllowedPlayer(player)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${formData.allowedPlayers?.includes(player) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-500'}`}>{player}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {formData.type === 'text' ? (
                   <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Imagen Cabecera</label>
                          <div className="flex gap-2">
                            <input type="text" value={formData.attachment} onChange={e => setFormData({...formData, attachment: e.target.value})} className="flex-1 p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white text-sm" placeholder="URL opcional..." />
                            <button type="button" onClick={() => handleTriggerUpload('attachment')} className="px-3 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 rounded-lg transition-colors"><Upload size={18}/></button>
                          </div>
                      </div>
                      <div className="bg-white dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white">
                          <ReactQuill theme="snow" value={formData.content} onChange={value => setFormData({...formData, content: value})} modules={{ toolbar: [[{ 'header': [1, 2, false] }],['bold', 'italic', 'underline'],[{ 'list': 'ordered'}, { 'list': 'bullet' }],['clean']] }} className="h-64 mb-12" />
                      </div>
                   </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">{formData.type === 'image' ? 'Imagen' : 'PDF'} (URL o Subir)</label>
                        <div className="flex gap-2">
                            <input type="text" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="flex-1 p-2 bg-white dark:bg-black/40 border border-neutral-300 dark:border-white/20 rounded-lg outline-none dark:text-white font-mono text-sm" placeholder="https://..." />
                            <button type="button" onClick={() => handleTriggerUpload('content')} className="px-3 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 rounded-lg transition-colors" title="Subir"><Upload size={18}/></button>
                        </div>
                        {formData.content && formData.type === 'image' && <div className="mt-4 border-2 border-dashed border-neutral-300 dark:border-white/10 rounded-xl p-4 flex justify-center bg-black/50"><img src={formData.content} alt="Preview" className="max-h-64 object-contain shadow-lg" /></div>}
                        {formData.content && formData.type === 'pdf' && <div className="mt-4 border-2 border-dashed border-neutral-300 dark:border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-neutral-100 dark:bg-white/5 text-neutral-500"><File size={48} className="mb-2 text-red-400"/><span className="text-sm font-bold">PDF Vinculado Correctamente</span></div>}
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