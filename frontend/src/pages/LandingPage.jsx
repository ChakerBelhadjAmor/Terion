import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BarChart3, Cpu } from 'lucide-react';
import DropZone from '../components/DropZone/DropZone';
import { useApp } from '../context/AppContext';

const features = [
  { icon: BarChart3, label: 'Visualisation capacité/charge en temps réel' },
  { icon: Cpu, label: 'Optimisation automatique via Timefold' },
  { icon: Sparkles, label: 'Assistant IA intelligent (Llama 3 offline)' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { loadDemoData } = useApp();

  const handleSuccess = () => navigate('/dashboard');

  const handleDemo = () => {
    loadDemoData();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-primary/5 to-elm/5 px-6 py-16">
      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex flex-col items-center gap-4 mb-4">
          <img src="/teriak_logo.png" alt="Laboratoires Teriak" className="h-25" />
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mt-6 mb-3">
          Pilotez votre production
          <br />
          <span className="text-primary">avec précision</span>
        </h2>
        <p className="text-gray-500 max-w-md text-lg">
          Chargez votre PDP et obtenez instantanément une analyse complète
          de la charge de vos 10 ateliers.
        </p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="w-full max-w-xl"
      >
        <DropZone onSuccess={handleSuccess} />
      </motion.div>

      {/* Demo Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-16 h-px bg-gray-200" />
          <span>ou</span>
          <div className="w-16 h-px bg-gray-200" />
        </div>
        <button
          onClick={handleDemo}
          className="flex items-center gap-2 px-5 py-2.5 bg-elm text-white rounded-xl text-sm font-medium hover:bg-elm-light transition-colors shadow-md"
        >
          Explorer avec les données de démonstration
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>

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

      {/* Company logo footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 flex flex-col items-center gap-2"
      >
        <p className="text-xs text-gray-400">Un produit</p>
        <img src="/teriak_logo.png" alt="Laboratoires Teriak" className="h-8 opacity-60" />
      </motion.div>
    </div>
  );
}
