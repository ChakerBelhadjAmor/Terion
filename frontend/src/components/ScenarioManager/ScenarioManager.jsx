import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, Trash2, Loader2, Calendar, Package, Play, CheckCircle2, Upload } from 'lucide-react';
import { listPdps, getPdp, deletePdp } from '../../utils/api';
import { useApp } from '../../context/AppContext';
import DropZone from '../DropZone/DropZone';

export default function ScenarioManager({ open, onClose, onLoaded }) {
  const { loadPlanFromBackend, activePlanId } = useApp();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listPdps();
      setScenarios(data);
    } catch (e) {
      setError(e.message || 'Impossible de charger les scénarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { refresh(); setShowUpload(false); }
  }, [open, refresh]);

  const handleLoad = async (id) => {
    setBusyId(id);
    setError('');
    try {
      const detail = await getPdp(id);
      onClose();
      setTimeout(() => {
        loadPlanFromBackend(detail);
        if (onLoaded) onLoaded(detail);
      }, 0);
    } catch (e) {
      setError(e.message || 'Erreur de chargement.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Supprimer ce scénario définitivement ?')) return;
    setBusyId(id);
    try {
      await deletePdp(id);
      await refresh();
    } catch (e) {
      setError(e.message || 'Erreur de suppression.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    refresh();
    if (onLoaded) onLoaded();
    onClose();
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                  <FolderOpen className="w-6 h-6 text-primary" />
                  Gestionnaire de Scénarios
                </h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  Gérez vos PDP sauvegardés et choisissez l'atelier de travail actif.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowUpload(v => !v)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-semibold transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {showUpload ? 'Fermer' : 'Nouveau scénario'}
                </button>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Upload zone (collapsible) */}
            {showUpload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-b border-gray-100 overflow-hidden"
              >
                <div className="p-6 bg-gray-50/50">
                  <DropZone onSuccess={handleUploadSuccess} />
                </div>
              </motion.div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Chargement…
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                  {error}
                </div>
              ) : scenarios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FolderOpen className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-700 font-semibold mb-1">Aucun scénario enregistré</p>
                  <p className="text-gray-400 text-sm">Cliquez sur « Nouveau scénario » pour en créer un.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scenarios.map(s => {
                    const isActive = activePlanId === s.id;
                    const isBusy = busyId === s.id;
                    return (
                      <motion.div
                        key={s.id}
                        layout
                        className={`relative rounded-2xl border-2 p-4 transition-all ${
                          isActive
                            ? 'border-primary bg-primary/5 shadow-glow-primary'
                            : 'border-gray-100 bg-white hover:border-primary/40'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            Actif
                          </span>
                        )}

                        <h3 className="font-bold text-gray-800 truncate pr-16">{s.name}</h3>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{s.filename}</p>

                        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(s.uploadDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            {s.productCount ?? 0} produits
                          </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleLoad(s.id)}
                            disabled={isBusy || isActive}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 text-sm font-semibold transition-colors"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            {isActive ? 'Chargé' : 'Charger'}
                          </button>
                          <button
                            onClick={(e) => handleDelete(s.id, e)}
                            disabled={isBusy}
                            className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
