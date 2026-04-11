import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, Layers, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ATELIER_NAMES, generateGanttData } from '../data/mockData';

// --- Sub-components ---

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
      ring: 'ring-green-200',
    },
    good: {
      icon: AlertTriangle,
      label: 'Attention requise',
      sub: `${nearCapacity.length} atelier(s) proches de la saturation`,
      color: 'text-accent',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      ring: 'ring-amber-200',
    },
    critical: {
      icon: XCircle,
      label: 'Surcharge détectée',
      sub: `${overloaded.length} atelier(s) dépassent 100% de capacité`,
      color: 'text-red-500',
      bg: 'bg-red-50',
      border: 'border-red-200',
      ring: 'ring-red-200',
    },
  };
  const { icon: Icon, label, sub, color, bg, border, ring } = configs[healthScore];

  const totalLoad = utilization.reduce((s, u) => s + u.load, 0);
  const totalCapacity = utilization.reduce((s, u) => s + u.capacity, 0);
  const avgUtil = Math.round((totalLoad / totalCapacity) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${bg} border ${border} rounded-2xl p-6 flex items-start gap-4 shadow-card ring-2 ${ring} ring-offset-2`}
    >
      <div className={`w-14 h-14 rounded-2xl ${bg} border ${border} flex items-center justify-center`}>
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <div className="flex-1">
        <h2 className={`text-xl font-bold ${color}`}>{label}</h2>
        <p className="text-gray-500 text-sm mt-0.5">{sub}</p>
        <div className="flex gap-4 mt-3">
          <span className="text-xs text-gray-500">Charge moy. <strong className="text-gray-800">{avgUtil}%</strong></span>
          <span className="text-xs text-green-600">✓ {healthy.length} ok</span>
          {nearCapacity.length > 0 && <span className="text-xs text-amber-600">⚠ {nearCapacity.length} proches</span>}
          {overloaded.length > 0 && <span className="text-xs text-red-600">✗ {overloaded.length} surcharge</span>}
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
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Charge vs Capacité par Atelier</h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={utilization} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="atelier" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="h" />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={utilization[0]?.capacity} stroke="#FBB829" strokeDasharray="6 3" label={{ value: 'Capacité', position: 'right', fontSize: 11, fill: '#FBB829' }} />
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
      </div>
    </motion.div>
  );
}

function HeatmapGrid() {
  const { utilization } = useApp();
  const getCellStyle = (util) => {
    if (util > 100) return { bg: 'bg-red-500/20 border-red-400', text: 'text-red-600', glow: true };
    if (util > 80) return { bg: 'bg-accent/20 border-accent/60', text: 'text-amber-700', glow: false };
    if (util > 60) return { bg: 'bg-primary/15 border-primary/30', text: 'text-elm', glow: false };
    return { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600', glow: false };
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className={`relative rounded-xl border-2 p-4 text-center transition-all cursor-default ${bg} ${glow ? 'animate-pulse-slow shadow-glow-accent' : ''}`}
              title={u.name}
            >
              <p className="text-2xl font-extrabold text-elm">{u.atelier}</p>
              <p className={`text-lg font-bold mt-1 ${text}`}>{u.utilization}%</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{u.name.split(' ')[0]}</p>
              {u.utilization > 100 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function GanttChart() {
  const { products } = useApp();
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const ganttData = generateGanttData(products);
  const weeks = [1, 2, 3, 4];
  const ateliers = [...new Set(ganttData.map(r => r.atelier))].sort();

  const getProductColor = (productId) => {
    const p = products.find(p => p.id === productId);
    return p?.color || '#3CC2B1';
  };

  const getCellData = (atelier, week) => {
    return ganttData.filter(r => r.atelier === atelier && r.week === week);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Planning Gantt — Gammes par Semaine</h3>
        <span className="text-xs text-gray-400 ml-auto">Survolez pour voir la gamme complète</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-gray-500 font-medium w-8">Atelier</th>
              {weeks.map(w => (
                <th key={w} className="text-center py-2 px-2 text-gray-500 font-medium">
                  Semaine {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ateliers.map(atelier => (
              <tr key={atelier} className="border-t border-gray-50">
                <td className="pr-4 py-2">
                  <div className="w-7 h-7 rounded-lg bg-elm/10 flex items-center justify-center font-bold text-elm text-sm">
                    {atelier}
                  </div>
                </td>
                {weeks.map(week => {
                  const cells = getCellData(atelier, week);
                  return (
                    <td key={week} className="px-1 py-1.5 align-top">
                      <div className="flex flex-col gap-1 min-h-[32px]">
                        {cells.map((cell, i) => (
                          <motion.div
                            key={i}
                            onMouseEnter={() => setHoveredProduct(cell.productId)}
                            onMouseLeave={() => setHoveredProduct(null)}
                            className="rounded-md px-2 py-1 text-white text-xs font-medium truncate cursor-default transition-all"
                            style={{
                              backgroundColor: getProductColor(cell.productId),
                              opacity: hoveredProduct !== null && hoveredProduct !== cell.productId ? 0.3 : 1,
                              boxShadow: hoveredProduct === cell.productId ? `0 0 0 2px white, 0 0 0 4px ${getProductColor(cell.productId)}` : 'none',
                            }}
                            title={`${cell.productName} — ${cell.lots} lot(s) — ${cell.duration}h`}
                          >
                            {cell.productName.split(' ')[0]}
                          </motion.div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {products.map(p => (
          <span
            key={p.id}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-opacity"
            style={{
              backgroundColor: p.color + '20',
              border: `1px solid ${p.color}40`,
              opacity: hoveredProduct !== null && hoveredProduct !== p.id ? 0.4 : 1,
            }}
            onMouseEnter={() => setHoveredProduct(p.id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-700 font-medium">{p.name.split(' ')[0]}</span>
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// --- Main Page ---
export default function Dashboard() {
  const { pdpLoaded, fileName, params } = useApp();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-400 text-sm mt-1">
            {pdpLoaded ? fileName : 'Données de démonstration'} · Horizon {params.weeks} semaine{params.weeks > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Mis à jour maintenant</span>
        </div>
      </motion.div>

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
