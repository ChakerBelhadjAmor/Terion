import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Sliders,
  Package,
  Settings,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de Bord' },
  { to: '/simulation', icon: Sliders, label: 'Simulation' },
  { to: '/products', icon: Package, label: 'Base Produits' },
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  const { healthScore, overloaded, pdpLoaded, fileName } = useApp();

  const healthColor = {
    excellent: 'text-green-400',
    good: 'text-accent',
    critical: 'text-red-400',
  }[healthScore];

  const healthLabel = {
    excellent: 'Optimal',
    good: 'Attention',
    critical: 'Critique',
  }[healthScore];

  return (
    <aside className="w-64 min-h-screen bg-elm flex flex-col shadow-xl relative z-10 shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow-primary">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Teriak</p>
            <p className="text-white/50 text-xs">Plan de Charge</p>
          </div>
        </div>
      </div>

      {/* PDP Status */}
      {pdpLoaded && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 px-3 py-2.5 bg-white/10 rounded-xl border border-white/10"
        >
          <p className="text-white/50 text-xs mb-1">PDP chargé</p>
          <p className="text-white text-xs font-medium truncate">{fileName}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`w-2 h-2 rounded-full ${healthColor.replace('text-', 'bg-')}`} />
            <span className={`text-xs font-semibold ${healthColor}`}>{healthLabel}</span>
            {overloaded.length > 0 && (
              <span className="text-xs text-white/40 ml-auto">
                {overloaded.length} surcharge{overloaded.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 opacity-60" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">
          Laboratoires Teriak © 2024
        </p>
      </div>
    </aside>
  );
}
