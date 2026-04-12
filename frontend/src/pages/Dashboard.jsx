import { useMemo, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, Layers, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateGanttData } from '../data/mockData';

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
    <div className={`${bg} border ${border} rounded-2xl p-6 flex items-start gap-4 shadow-card ring-2 ${ring} ring-offset-2`}>
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
    </div>
  );
}

function CapacityChart() {
  const { utilization } = useApp();
  const maxH = Math.max(1, ...utilization.map(u => Math.max(u.load, u.capacity)));
  const refCapacity = utilization[0]?.capacity ?? 0;
  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Charge vs Capacité par Atelier</h3>
      </div>
      <div className="relative" style={{ height: 260 }}>
        <div
          className="absolute left-0 right-0 border-t border-dashed border-accent"
          style={{ bottom: `${(refCapacity / maxH) * 100}%` }}
          title={`Capacité ${refCapacity}h`}
        />
        <div className="flex items-end justify-around h-full gap-2 px-2">
          {utilization.map((u) => {
            const color = u.utilization > 100 ? '#ef4444' : u.utilization > 80 ? '#FBB829' : '#3CC2B1';
            const h = Math.max(2, (u.load / maxH) * 100);
            return (
              <div key={u.atelier} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div
                  className="w-full rounded-t-md transition-all relative"
                  style={{ height: `${h}%`, backgroundColor: color }}
                  title={`${u.name}: ${u.load}h / ${u.capacity}h (${u.utilization}%)`}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-gray-600 opacity-0 group-hover:opacity-100">
                    {u.load}h
                  </span>
                </div>
                <span className="text-xs text-gray-500 mt-1">{u.atelier}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-4 mt-2 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-primary inline-block" /> Nominal</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-accent inline-block" /> Proche saturation</span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded bg-red-400 inline-block" /> Surcharge</span>
      </div>
    </div>
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
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Heatmap des Ateliers</h3>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {utilization.map((u) => {
          const { bg, text, glow } = getCellStyle(u.utilization);
          return (
            <div
              key={u.atelier}
              className={`relative rounded-xl border-2 p-4 text-center transition-all cursor-default ${bg} ${glow ? 'animate-pulse-slow shadow-glow-accent' : ''}`}
              title={u.name}
            >
              <p className="text-2xl font-extrabold text-elm">{u.atelier}</p>
              <p className={`text-lg font-bold mt-1 ${text}`}>{u.utilization}%</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{u.name.split(' ')[0]}</p>
              {u.utilization > 100 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GanttChart() {
  const { products } = useApp();
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const ganttData = useMemo(() => generateGanttData(products), [products]);
  const weeks = [1, 2, 3, 4];
  const ateliers = useMemo(
    () => [...new Set(ganttData.map(r => r.atelier))].sort(),
    [ganttData]
  );

  const getProductColor = (productId) => {
    const p = products.find(p => p.id === productId);
    return p?.color || '#3CC2B1';
  };

  const getCellData = (atelier, week) => {
    return ganttData.filter(r => r.atelier === atelier && r.week === week);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
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
                          <div
                            key={`${cell.productId}-${i}`}
                            onMouseEnter={() => setHoveredProduct(cell.productId)}
                            onMouseLeave={() => setHoveredProduct(null)}
                            className="rounded-md px-2 py-1 text-white text-xs font-medium truncate cursor-default"
                            style={{
                              backgroundColor: getProductColor(cell.productId),
                              opacity: hoveredProduct !== null && hoveredProduct !== cell.productId ? 0.3 : 1,
                              boxShadow: hoveredProduct === cell.productId ? `0 0 0 2px white, 0 0 0 4px ${getProductColor(cell.productId)}` : 'none',
                            }}
                            title={`${cell.productName} — ${cell.lots} lot(s) — ${cell.duration}h`}
                          >
                            {cell.productName.split(' ')[0]}
                          </div>
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
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: (p.color || '#3CC2B1') + '20',
              border: `1px solid ${(p.color || '#3CC2B1')}40`,
              opacity: hoveredProduct !== null && hoveredProduct !== p.id ? 0.4 : 1,
            }}
            onMouseEnter={() => setHoveredProduct(p.id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#3CC2B1' }} />
            <span className="text-gray-700 font-medium">{(p.name || '').split(' ')[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function Dashboard() {
  const { pdpLoaded, fileName, params } = useApp();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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
