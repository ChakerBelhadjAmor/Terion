import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ArrowRight, Sparkles, BarChart3, Cpu,
  FolderOpen, Calendar, Package, Play, Loader2, Trash2,
} from 'lucide-react';
import DropZone from '../components/DropZone/DropZone';
import { useApp } from '../context/AppContext';
import { listPdps, getPdp, deletePdp } from '../utils/api';

const features = [
  { icon: BarChart3, label: 'Visualisation capacité/charge en temps réel' },
  { icon: Cpu, label: 'Optimisation automatique via Timefold' },
  { icon: Sparkles, label: 'Assistant IA intelligent (Llama 3 offline)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { loadDemoData, loadPlanFromBackend } = useApp();

  const [scenarios, setScenarios] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const data = await listPdps();
      setScenarios(data);
    } catch (e) {
      setListError(e.message || 'Impossible de charger les scénarios.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSuccess = () => navigate('/dashboard');

  const handleDemo = () => {
    loadDemoData();
    navigate('/dashboard');
  };

  const handleLoad = async (id) => {
    setBusyId(id);
    try {
      const detail = await getPdp(id);
      loadPlanFromBackend(detail);
      navigate('/dashboard');
    } catch (e) {
      setListError(e.message || 'Erreur de chargement.');
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
      setListError(e.message || 'Erreur de suppression.');
    } finally {
      setBusyId(null);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-white via-primary/5 to-elm/5 px-6 py-12">
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-elm flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-elm">Teriak</h1>
            <p className="text-primary font-medium">Plan de Charge</p>
          </div>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mt-6 mb-3">
          Pilotez votre production
          <br />
          <span className="text-primary">avec précision</span>
        </h2>
        <p className="text-gray-500 max-w-md mx-auto text-lg">
          Chargez un nouveau PDP ou reprenez un scénario existant.
        </p>
      </motion.div>

      {/* Two-column: Upload + Scenarios */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: Upload */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Nouveau scénario
            </h3>
          </div>
          <DropZone onSuccess={handleSuccess} />

          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={handleDemo}
              className="flex items-center gap-2 px-4 py-2 text-elm hover:text-primary text-sm font-medium transition-colors"
            >
              Ou explorer avec les données de démonstration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.section>

        {/* RIGHT: Existing Scenarios */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Scénarios existants
            </h3>
            {scenarios.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 font-medium">
                {scenarios.length} enregistré{scenarios.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-card min-h-[320px] max-h-[440px] overflow-y-auto">
            {loadingList ? (
              <div className="h-full min-h-[320px] flex items-center justify-center text-gray-400 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Chargement…
              </div>
            ) : listError ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                  {listError}
                </div>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <FolderOpen className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-700 font-semibold">Aucun scénario enregistré</p>
                <p className="text-gray-400 text-sm mt-1">
                  Uploadez votre premier PDP pour commencer.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                <AnimatePresence>
                  {scenarios.map(s => {
                    const isBusy = busyId === s.id;
                    return (
                      <motion.li
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(s.uploadDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {s.productCount ?? 0} produits
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleLoad(s.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 text-xs font-semibold transition-colors"
                          >
                            {isBusy
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Play className="w-3.5 h-3.5" />}
                            Charger
                          </button>
                          <button
                            onClick={(e) => handleDelete(s.id, e)}
                            disabled={isBusy}
                            className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 text-gray-400 flex items-center justify-center transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.section>
      </div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-14 flex gap-6 flex-wrap justify-center"
      >
        {features.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            {label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
