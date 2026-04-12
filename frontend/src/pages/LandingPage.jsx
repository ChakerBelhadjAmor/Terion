import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Info } from 'lucide-react';
import DropZone from '../components/DropZone/DropZone';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { loadDemoData } = useApp();

  const handleSuccess = () => navigate('/dashboard');

  const handleDemo = () => {
    loadDemoData();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-primary/5 to-elm/5 px-6 py-16">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] rounded-full bg-elm/5 blur-3xl pointer-events-none" />

      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10 relative z-10"
      >
        <div className="flex flex-col items-center gap-4 mb-4">
          <img src="/teriak_logo.png" alt="Laboratoires Teriak" className="h-20" />
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mt-6 mb-3 tracking-tight">
          Pilotez votre production
          <br />
          <span className="bg-gradient-to-r from-primary to-elm bg-clip-text text-transparent">avec précision</span>
        </h2>
        <p className="text-gray-500 max-w-lg text-lg leading-relaxed">
          Chargez votre PDP et obtenez instantanément une analyse complète
          de la charge de vos 10 ateliers.
        </p>
      </motion.div>

      {/* Info note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-start gap-3 mb-10 max-w-xl relative z-10 px-5 py-4 bg-primary/5 border border-primary/15 rounded-xl"
      >
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">Format du fichier Excel</p>
          <p>
            Pour chaque atelier (colonnes A à J), le temps à renseigner correspond au
            <strong className="text-elm"> temps de production + temps de nettoyage</strong> de
            l'atelier après la production.
          </p>
        </div>
      </motion.div>

      {/* Drop Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-xl relative z-10"
      >
        <DropZone onSuccess={handleSuccess} />
      </motion.div>

      {/* Demo Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 flex flex-col items-center gap-2 relative z-10"
      >
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="w-16 h-px bg-gray-200" />
          <span>ou</span>
          <div className="w-16 h-px bg-gray-200" />
        </div>
        <button
          onClick={handleDemo}
          className="group flex items-center gap-2 px-5 py-2.5 bg-elm text-white rounded-xl text-sm font-medium hover:bg-elm-light transition-all shadow-md hover:shadow-lg hover:gap-3"
        >
          Explorer avec les données de démonstration
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>

      {/* Company logo footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 flex flex-col items-center gap-2 relative z-10"
      >
        <p className="text-[10px] text-gray-300 uppercase tracking-widest">Un produit</p>
        <img src="/teriak_logo.png" alt="Laboratoires Teriak" className="h-7 opacity-40 grayscale hover:grayscale-0 hover:opacity-60 transition-all" />
      </motion.div>
    </div>
  );
}
