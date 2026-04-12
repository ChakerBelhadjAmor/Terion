import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, Layers,
  Package, Factory, Timer, Gauge,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import GanttChart from '../components/GanttChart/GanttChart';

function KpiCard({ icon: Icon, label, value, unit, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 mt-0.5">
          {value}<span className="text-sm font-semibold text-gray-400 ml-0.5">{unit}</span>
        </p>
      </div>
    </motion.div>
  );
}

function HealthScore() {
  const { healthScore, overloaded, nearCapacity, healthy, utilization } = useApp();
  const configs = {
    excellent: {
      icon: CheckCircle2,
      label: 'Usine en bonne santé',
      sub: 'Tous les ateliers sont sous capacité',
      color: 'text-green-500',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    good: {
      icon: AlertTriangle,
      label: 'Attention requise',
      sub: `${nearCapacity.length} atelier(s) proches de la saturation`,
      color: 'text-accent',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    critical: {
      icon: XCircle,
      label: 'Surcharge détectée',
      sub: `${overloaded.length} atelier(s) dépassent 100% de capacité`,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  };
  const { icon: Icon, label, sub, color, bg, border } = configs[healthScore];

  const totalLoad = utilization.reduce((s, u) => s + u.load, 0);
  const totalCapacity = utilization.reduce((s, u) => s + u.capacity, 0);
  const avgUtil = Math.round((totalLoad / totalCapacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bg} border ${border} rounded-2xl p-5 flex items-center gap-4 shadow-card`}
    >
      <div className={`w-12 h-12 rounded-2xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className={`text-lg font-bold ${color}`}>{label}</h2>
        <p className="text-gray-500 text-sm">{sub}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-gray-500">Charge moy. <strong className="text-gray-800">{avgUtil}%</strong></span>
        <div className="flex gap-2 text-xs">
          <span className="text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">{healthy.length} ok</span>
          {nearCapacity.length > 0 && <span className="text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">{nearCapacity.length} proches</span>}
          {overloaded.length > 0 && <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-medium">{overloaded.length} surcharge</span>}
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const { load, capacity, utilization } = payload[0]?.payload || {};
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">Atelier {label}</p>
      <p className="text-gray-500">Charge : <span className="font-bold text-elm">{load}h</span></p>
      <p className="text-gray-500">Capacité : <span className="font-bold text-gray-700">{capacity}h</span></p>
      <p className="text-gray-500">Utilisation : <span className={`font-bold ${utilization > 100 ? 'text-red-500' : utilization > 80 ? 'text-amber-500' : 'text-green-500'}`}>{utilization}%</span></p>
    </div>
  );
};

function CapacityChart() {
  const { utilization } = useApp();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Charge vs Capacité par Atelier</h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={utilization} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="atelier" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="h" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="capacity" name="Capacité" radius={[6, 6, 0, 0]} fill="none" stroke="#FBB829" strokeWidth={2} strokeDasharray="6 3" />
          <Bar dataKey="load" name="Charge" radius={[6, 6, 0, 0]}>
            {utilization.map((entry) => (
              <Cell
                key={entry.atelier}
                fill={entry.utilization > 100 ? '#ef4444' : entry.utilization > 80 ? '#FBB829' : '#3CC2B1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-primary inline-block" /> Nominal</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-accent inline-block" /> Proche saturation</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Surcharge</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm border-2 border-dashed border-accent inline-block" /> Capacité</span>
      </div>
    </motion.div>
  );
}

function HeatmapGrid() {
  const { utilization } = useApp();
  const getCellStyle = (util) => {
    if (util > 100) return { bg: 'bg-red-500/15 border-red-300', text: 'text-red-600', glow: true };
    if (util > 80) return { bg: 'bg-accent/15 border-accent/50', text: 'text-amber-700', glow: false };
    if (util > 60) return { bg: 'bg-primary/10 border-primary/25', text: 'text-elm', glow: false };
    return { bg: 'bg-gray-50/80 border-gray-200', text: 'text-gray-500', glow: false };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Heatmap des Ateliers</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {utilization.map((u, i) => {
          const { bg, text, glow } = getCellStyle(u.utilization);
          return (
            <motion.div
              key={u.atelier}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className={`relative rounded-xl border-2 p-3.5 text-center transition-all cursor-default hover:scale-[1.03] ${bg} ${glow ? 'animate-pulse-slow shadow-glow-accent' : 'hover:shadow-card'}`}
              title={u.name}
            >
              <p className="text-xl font-extrabold text-elm">{u.atelier}</p>
              <p className={`text-base font-bold mt-0.5 ${text}`}>{u.utilization}%</p>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{u.name}</p>
              {u.utilization > 100 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { pdpLoaded, fileName, params, products, utilization } = useApp();

  const totalLots = products.reduce((s, p) => s + (p.lots || 1), 0);
  const totalLoad = Math.round(utilization.reduce((s, u) => s + u.load, 0));
  const totalCapacity = Math.round(utilization.reduce((s, u) => s + u.capacity, 0));
  const activeAteliers = utilization.filter(u => u.load > 0).length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pdpLoaded ? fileName : 'Données de démonstration'} · Horizon {params.weeks} semaine{params.weeks > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          <span>Mis à jour maintenant</span>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="Produits" value={products.length} unit="" color="bg-primary/10 text-primary" delay={0.02} />
        <KpiCard icon={Factory} label="Lots totaux" value={totalLots} unit="" color="bg-elm/10 text-elm" delay={0.06} />
        <KpiCard icon={Timer} label="Charge totale" value={totalLoad} unit="h" color="bg-accent/10 text-accent" delay={0.10} />
        <KpiCard icon={Gauge} label="Ateliers actifs" value={activeAteliers} unit={`/${utilization.length}`} color="bg-purple-100 text-purple-600" delay={0.14} />
      </div>

      {/* Health Score */}
      <HealthScore />

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CapacityChart />
        <HeatmapGrid />
      </div>

      {/* Gantt */}
      <GanttChart />
    </div>
  );
}
