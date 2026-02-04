import { useState } from 'react';
import { X, Link, Upload, Type, FileText, Trash2 } from 'lucide-react'; // Importamos Trash2

function ResourceModal({ isOpen, onClose, onSubmit, onClear, title, showTitleInput = false }) { // Añadido onClear
  const [activeTab, setActiveTab] = useState('file'); 
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');

  if (!isOpen) return null;

  // ... (Lógica de validación igual que antes) ...
  const isSubmitDisabled = showTitleInput && !titleInput.trim();

  const handleSubmit = () => {
    if (activeTab === 'url' && urlInput && !isSubmitDisabled) {
      const isPdf = urlInput.toLowerCase().endsWith('.pdf');
      onSubmit({ type: 'url', contentType: isPdf ? 'pdf' : 'image', src: urlInput, title: titleInput });
      resetAndClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !isSubmitDisabled) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const isPdf = file.type === 'application/pdf';
        onSubmit({ type: 'file', contentType: isPdf ? 'pdf' : 'image', src: reader.result, title: titleInput });
        resetAndClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    if (onClear) {
        if(confirm("¿Seguro que quieres borrar el fondo?")) {
            onClear();
            resetAndClose();
        }
    }
  };

  const resetAndClose = () => {
    setUrlInput('');
    setTitleInput('');
    setActiveTab('file');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5">
          <h3 className="font-bold text-neutral-700 dark:text-white uppercase tracking-wider text-sm">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-500"><X size={20} /></button>
        </div>

        {/* Tabs */}
        {/* ... (Igual que antes) ... */}
        <div className="flex border-b border-neutral-200 dark:border-white/10">
          <button onClick={() => setActiveTab('file')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'file' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5'}`}>
            <Upload size={16} /> Subir Archivo
          </button>
          <button onClick={() => setActiveTab('url')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5'}`}>
            <Link size={16} /> Desde URL
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4 overflow-y-auto">
           {/* ... (Inputs de Título y URL/File igual que antes) ... */}
           {showTitleInput && (
            <div className="relative">
              <Type size={16} className={`absolute top-3 left-3 ${!titleInput ? 'text-red-400' : 'text-emerald-500'}`} />
              <input 
                type="text" 
                placeholder="Título obligatorio (Ej: Mapa, Carta...)" 
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 bg-neutral-100 dark:bg-black/40 border rounded-lg text-sm focus:outline-none focus:ring-2 dark:text-white transition-colors ${!titleInput ? 'border-red-300 focus:ring-red-500' : 'border-neutral-200 dark:border-white/10 focus:ring-indigo-500'}`}
                autoFocus
              />
            </div>
          )}

          {activeTab === 'file' ? (
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl transition-colors ${isSubmitDisabled ? 'border-neutral-200 opacity-50 cursor-not-allowed' : 'border-neutral-300 dark:border-white/20 cursor-pointer hover:bg-neutral-50 dark:hover:bg-white/5'}`}>
              <FileText size={32} className="text-neutral-400 mb-2" />
              <span className="text-xs text-neutral-500 font-bold uppercase text-center px-4">
                {isSubmitDisabled ? 'Escribe un título primero' : 'Imagen o PDF'}
              </span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} disabled={isSubmitDisabled} />
            </label>
          ) : (
            <div className="space-y-4">
              <input 
                type="url" 
                placeholder="https://..." 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full p-3 bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitDisabled || !urlInput}
                className={`w-full py-2 font-bold rounded-lg shadow-lg transition-colors ${isSubmitDisabled || !urlInput ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                CARGAR
              </button>
            </div>
          )}

          {/* BOTÓN DE BORRAR (Si se pasa la función onClear) */}
          {onClear && (
             <div className="pt-4 mt-2 border-t border-neutral-200 dark:border-white/10">
                <button 
                    onClick={handleClear}
                    className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-bold transition-colors"
                >
                    <Trash2 size={16} /> Quitar Imagen Actual
                </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceModal;