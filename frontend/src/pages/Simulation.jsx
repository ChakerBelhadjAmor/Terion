import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Sliders, TrendingUp, TrendingDown, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ATELIERS, ATELIER_NAMES } from '../data/mockData';

// --- Global slider (weeks, daysPerWeek) ---
function GlobalSliderRow({ label, paramKey, min, max, step, unit, description }) {
  const { params, updateParam } = useApp();
  const current = params[paramKey];
  const pct = ((current - min) / (max - min)) * 100;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{label}</p>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-elm">{current}</span>
          <span className="text-gray-400 text-sm ml-1">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={current}
        onChange={e => updateParam(paramKey, Number(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(to right, #3CC2B1 ${pct}%, #e2e8f0 ${pct}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-300 mt-1">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// --- Stepper button ---
function Stepper({ value, min, max, step, unit, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
      >−</button>
      <span className="w-12 text-center text-sm font-semibold text-elm">
        {value}{unit}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 disabled:opacity-30 flex items-center justify-center text-gray-600 font-bold text-sm transition-colors"
      >+</button>
    </div>
  );
}

// --- Per-atelier row ---
function AtelierRow({ atelier }) {
  const { atelierParams, updateAtelierParam, utilization } = useApp();
  const ap = atelierParams[atelier];
  const u = utilization.find(x => x.atelier === atelier);

  const color = u?.utilization > 100 ? 'text-red-500' : u?.utilization > 80 ? 'text-amber-500' : 'text-green-600';
  const barColor = u?.utilization > 100 ? '#ef4444' : u?.utilization > 80 ? '#FBB829' : '#3CC2B1';

  return (
    <motion.div
      layout
      className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
    >
      {/* Atelier badge */}
      <div className="w-8 h-8 rounded-lg bg-elm/10 flex items-center justify-center font-bold text-elm text-sm shrink-0">
        {atelier}
      </div>

      {/* Name */}
      <div className="w-44 shrink-0">
        <p className="text-sm font-medium text-gray-700 truncate">{ATELIER_NAMES[atelier]}</p>
      </div>

      {/* Jours/semaine */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="text-xs text-gray-400">Jours/sem</span>
        <Stepper value={ap.daysPerWeek} min={1} max={7} step={1} unit=""
          onChange={v => updateAtelierParam(atelier, 'daysPerWeek', v)} />
      </div>

      {/* Postes/jour */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="text-xs text-gray-400">Postes/j</span>
        <Stepper value={ap.shiftsPerDay} min={1} max={3} step={1} unit=""
          onChange={v => updateAtelierParam(atelier, 'shiftsPerDay', v)} />
      </div>

      {/* H/poste */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="text-xs text-gray-400">H/poste</span>
        <Stepper value={ap.hoursPerShift} min={6} max={12} step={1} unit="h"
          onChange={v => updateAtelierParam(atelier, 'hoursPerShift', v)} />
      </div>

      {/* Rendement */}
      <div className="flex flex-col items-center gap-0.5 shrink-0">
        <span className="text-xs text-gray-400">Rendement</span>
        <Stepper value={ap.efficiency} min={50} max={100} step={5} unit="%"
          onChange={v => updateAtelierParam(atelier, 'efficiency', v)} />
      </div>

      {/* Capacité */}
      <div className="text-center shrink-0 w-16">
        <p className="text-xs text-gray-400">Capacité</p>
        <motion.p key={u?.capacity} initial={{ scale: 0.85 }} animate={{ scale: 1 }}
          className="text-sm font-bold text-gray-700">
          {u?.capacity}h
        </motion.p>
      </div>

      {/* Utilisation bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              layout
              className="h-full rounded-full"
              style={{ width: `${Math.min(u?.utilization ?? 0, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <span className={`text-sm font-bold shrink-0 w-12 text-right ${color}`}>
            {u?.utilization ?? 0}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{u?.load}h / {u?.capacity}h</p>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl shadow-card-hover border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-1">Atelier {label}</p>
      <p className="text-gray-500">Charge : <strong className="text-elm">{d.load}h</strong></p>
      <p className="text-gray-500">Capacité : <strong>{d.capacity}h</strong></p>
      <p className={`font-bold ${d.utilization > 100 ? 'text-red-500' : d.utilization > 80 ? 'text-amber-500' : 'text-green-500'}`}>
        {d.utilization}%
      </p>
    </div>
  );
};

export default function Simulation() {
  const { params, utilization, resetAtelierParams } = useApp();
  const [showChart, setShowChart] = useState(true);

  const totalLoad = utilization.reduce((s, u) => s + u.load, 0);
  const totalCapacity = utilization.reduce((s, u) => s + u.capacity, 0);
  const overloaded = utilization.filter(u => u.utilization > 100).length;
  const avgUtil = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <Sliders className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-extrabold text-gray-900">Simulation de Capacité</h1>
          </div>
          <button
            onClick={resetAtelierParams}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser les ateliers
          </button>
        </div>
        <p className="text-gray-400 text-sm">
          Ajustez les paramètres globaux et ceux de chaque atelier indépendamment.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Global params */}
        <div className="xl:col-span-1 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paramètres globaux</p>

          <GlobalSliderRow
            label="Nombre de Semaines"
            paramKey="weeks"
            min={1} max={12} step={1} unit=" sem."
            description="Horizon de planification"
          />

          {/* Summary card */}
          <motion.div layout className="bg-elm rounded-2xl p-5 text-white shadow-xl">
            <p className="text-white/60 text-sm mb-3">Vue d'ensemble</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-white/50 text-xs">Charge totale</p>
                <p className="text-xl font-extrabold">{Math.round(totalLoad)}h</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Capacité totale</p>
                <p className="text-xl font-extrabold">{Math.round(totalCapacity)}h</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Utilisation moy.</p>
                <p className="text-xl font-extrabold">{avgUtil}%</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Surcharges</p>
                <p className={`text-xl font-extrabold ${overloaded > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  {overloaded}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/10 flex gap-3 text-xs">
              <span className="text-green-300">✓ {utilization.filter(u => u.utilization <= 80).length} OK</span>
              <span className="text-accent">⚠ {utilization.filter(u => u.utilization > 80 && u.utilization <= 100).length} attention</span>
              <span className="text-red-300">✗ {overloaded} surcharge</span>
            </div>
          </motion.div>
        </div>

        {/* Right: per-atelier + chart */}
        <div className="xl:col-span-2 space-y-6">

          {/* Per-atelier table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Paramètres par Atelier</h3>
              <span className="text-xs text-gray-400">Jours/sem · Postes/j · H/poste · Rendement indépendants</span>
            </div>
            <div>
              {ATELIERS.map(atelier => (
                <AtelierRow key={atelier} atelier={atelier} />
              ))}
            </div>
          </motion.div>

          {/* Chart (collapsible) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
          >
            <button
              onClick={() => setShowChart(v => !v)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Impact en temps réel
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Live</span>
                {showChart ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {showChart && (
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={utilization} barGap={4} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="atelier" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="h" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="load" name="Charge (h)" radius={[6, 6, 0, 0]}>
                      {utilization.map(entry => (
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
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
