import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { Sliders, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeCapacity, getAtelierUtilization } from '../data/mockData';

function SliderRow({ label, value, min, max, step, unit, paramKey, description }) {
  const { params, updateParam } = useApp();
  const current = params[paramKey];
  const pct = ((current - min) / (max - min)) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{label}</p>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-elm">{current}</span>
          <span className="text-gray-400 text-sm ml-1">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          onChange={e => updateParam(paramKey, Number(e.target.value))}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #3CC2B1 ${pct}%, #e2e8f0 ${pct}%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-300 mt-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
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
  const { params, products, utilization } = useApp();

  const capacity = computeCapacity(params);
  const totalLoad = utilization.reduce((s, u) => s + u.load, 0);
  const totalCapacity = utilization.reduce((s, u) => s + u.capacity, 0);
  const overloaded = utilization.filter(u => u.utilization > 100).length;
  const avgUtil = Math.round((totalLoad / totalCapacity) * 100);

  const sliders = [
    {
      label: 'Nombre de Semaines',
      paramKey: 'weeks',
      min: 1, max: 12, step: 1,
      unit: ' sem.',
      description: "Horizon de planification du PDP"
    },
    {
      label: 'Jours par Semaine',
      paramKey: 'daysPerWeek',
      min: 1, max: 7, step: 1,
      unit: ' j',
      description: "Jours ouvrés par semaine"
    },
    {
      label: 'Postes par Jour',
      paramKey: 'shiftsPerDay',
      min: 1, max: 3, step: 1,
      unit: ' postes',
      description: "Nombre de shifts quotidiens (2×8h ou 3×8h)"
    },
    {
      label: 'Heures par Poste',
      paramKey: 'hoursPerShift',
      min: 6, max: 12, step: 1,
      unit: 'h',
      description: "Durée effective de chaque shift"
    },
    {
      label: 'Rendement (Efficacité)',
      paramKey: 'efficiency',
      min: 50, max: 100, step: 5,
      unit: '%',
      description: "Taux d'utilisation réel des équipements"
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Sliders className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-gray-900">Simulation de Capacité</h1>
        </div>
        <p className="text-gray-400 text-sm">Ajustez les paramètres et observez l'impact en temps réel sur la charge de vos ateliers.</p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Sliders Column */}
        <div className="xl:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>Capacité = Semaines × Jours × Postes × Heures × Rendement</span>
          </div>
          {sliders.map(s => <SliderRow key={s.paramKey} {...s} />)}

          {/* Capacity summary card */}
          <motion.div
            layout
            className="bg-elm rounded-2xl p-5 text-white shadow-xl mt-2"
          >
            <p className="text-white/60 text-sm mb-1">Capacité disponible / atelier</p>
            <motion.p
              key={capacity}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-extrabold"
            >
              {Math.round(capacity)}h
            </motion.p>
            <div className="mt-3 flex gap-3 text-sm">
              <div>
                <p className="text-white/50 text-xs">Ateliers OK</p>
                <p className="font-bold text-green-300">{utilization.filter(u => u.utilization <= 80).length}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Attention</p>
                <p className="font-bold text-accent">{utilization.filter(u => u.utilization > 80 && u.utilization <= 100).length}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs">Surcharge</p>
                <p className="font-bold text-red-300">{overloaded}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Live Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Impact en temps réel
              </h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Live</span>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={utilization} barGap={4} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="atelier" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="h" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={capacity} stroke="#FBB829" strokeDasharray="6 3" strokeWidth={2}
                  label={{ value: `Capacité: ${Math.round(capacity)}h`, position: 'insideTopRight', fontSize: 11, fill: '#FBB829', fontWeight: 600 }} />
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
          </motion.div>

          {/* Utilization table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <h3 className="font-bold text-gray-800">Détail par Atelier</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {utilization.map(u => (
                <div key={u.atelier} className="flex items-center gap-4 px-6 py-3">
                  <span className="w-8 h-8 rounded-lg bg-elm/10 flex items-center justify-center text-elm font-bold text-sm">{u.atelier}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">{u.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          layout
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(u.utilization, 100)}%`,
                            backgroundColor: u.utilization > 100 ? '#ef4444' : u.utilization > 80 ? '#FBB829' : '#3CC2B1',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${u.utilization > 100 ? 'text-red-500' : u.utilization > 80 ? 'text-amber-500' : 'text-green-600'}`}>
                      {u.utilization}%
                    </span>
                    <p className="text-xs text-gray-400">{u.load}h / {u.capacity}h</p>
                  </div>
                  <div>
                    {u.utilization > 100 && <TrendingUp className="w-4 h-4 text-red-400" />}
                    {u.utilization <= 80 && <TrendingDown className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
