import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sliders,
  Package,
  Settings,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/simulation', icon: Sliders, label: 'Simulation' },
  { to: '/products', icon: Package, label: 'Base Produits' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const { healthScore, overloaded, pdpLoaded, fileName, resetPdp } = useApp();
  const navigate = useNavigate();

  const healthColor = {
    excellent: 'text-green-400',
    good: 'text-accent',
    critical: 'text-red-400',
  }[healthScore];

  const healthDot = {
    excellent: 'bg-green-400',
    good: 'bg-accent',
    critical: 'bg-red-400',
  }[healthScore];

  const healthLabel = {
    excellent: 'Optimal',
    good: 'Attention',
    critical: 'Critique',
  }[healthScore];

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-elm to-elm-dark flex flex-col shadow-xl relative z-10 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <img src="/terion_logo.png" alt="Terion" className="h-12" />
        <p className="text-white/30 text-[10px] mt-1 tracking-wider">Plan de Charge Industriel</p>
      </div>

      {/* PDP Status */}
      <div className="mx-3 mt-3 space-y-2">
        {pdpLoaded ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2.5 bg-white/8 rounded-xl border border-white/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2 h-2 rounded-full ${healthDot} shrink-0`} />
              <p className="text-white/40 text-[10px] uppercase tracking-wider">PDP actif</p>
            </div>
            <p className="text-white text-xs font-medium truncate">{fileName}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`text-xs font-semibold ${healthColor}`}>{healthLabel}</span>
              {overloaded.length > 0 && (
                <span className="text-[10px] text-white/30 ml-auto">
                  {overloaded.length} surcharge{overloaded.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="px-3 py-2.5 bg-white/5 rounded-xl border border-white/8">
            <p className="text-white/30 text-xs">Aucun PDP chargé</p>
          </div>
        )}

        <button
          onClick={() => { resetPdp(); navigate('/'); }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/15 hover:bg-primary/30 border border-primary/20 text-primary text-xs font-semibold transition-all active:scale-[0.98]"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          {pdpLoaded ? 'Changer de fichier' : 'Charger un PDP'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-5 space-y-0.5">
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-semibold mb-2 px-3">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/8'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <motion.div initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </motion.div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/8">
        <img src="/teriak_logo.png" alt="Laboratoires Teriak" className="h-5 mx-auto opacity-30 mb-1.5" />
        <p className="text-white/20 text-[10px] text-center tracking-wide">
          Laboratoires Teriak © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
