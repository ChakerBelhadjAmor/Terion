import { useMemo, useRef, useState } from 'react';
import { Eye, Calendar, Clock, Hash, Cpu, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ATELIER_NAMES } from '../../data/mockData';

const PX_PER_HOUR = 6;
const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 56;
const LABEL_WIDTH = 180;
const SETUP_RATIO = 0;
const HOURS_PER_WORKDAY = 16;

const COLORS = {
  setup: '#FBB829',
  maintenance: '#a78bfa',
  idle: '#e5e7eb',
};

function getBaseDate() {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  const day = d.getDay();
  const daysToMonday = day === 1 ? 0 : (1 - day + 7) % 7;
  d.setDate(d.getDate() + daysToMonday);
  return d;
}

function addHours(date, h) {
  return new Date(date.getTime() + h * 3600_000);
}

function formatDayLabel(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

function formatDateTime(date) {
  return date.toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

function buildSchedule(products) {
  const cursors = {};
  const tasks = [];
  const ateliersUsed = new Set();
  let jobCounter = 1;

  for (const product of products) {
    if (!Array.isArray(product.gamme)) continue;
    for (const atelier of product.gamme) {
      const pt = product.processingTimes?.[atelier] || 0;
      if (pt <= 0) continue;
      const lots = Math.max(1, product.lots || 1);
      const rawDuration = pt * lots;
      const start = cursors[atelier] || 0;
      const end = start + rawDuration;
      tasks.push({
        id: `J${String(jobCounter++).padStart(4, '0')}`,
        atelier,
        productId: product.id,
        productName: product.name,
        color: product.color || '#3CC2B1',
        startHour: start,
        endHour: end,
        duration: rawDuration,
        setupDuration: rawDuration * SETUP_RATIO,
        productionDuration: rawDuration * (1 - SETUP_RATIO),
        lots,
      });
      cursors[atelier] = end;
      ateliersUsed.add(atelier);
    }
  }

  const ateliers = [...ateliersUsed].sort();
  const spanHours = Math.max(HOURS_PER_WORKDAY * 5, ...Object.values(cursors), 0);
  return { tasks, ateliers, spanHours };
}

function Tooltip({ task, baseDate, x, y }) {
  if (!task) return null;
  const start = addHours(baseDate, task.startHour);
  const end = addHours(baseDate, task.endHour);
  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-card-hover border border-gray-100 p-3 text-xs pointer-events-none min-w-[260px]"
      style={{ left: x + 14, top: y + 14 }}
    >
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />
        <span className="font-bold text-gray-800">{task.productName}</span>
      </div>
      <div className="space-y-1 text-gray-600">
        <div className="flex items-center gap-2">
          <Hash className="w-3 h-3 text-gray-400" />
          <span>Ordre : <strong className="text-gray-800">{task.id}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3 text-gray-400" />
          <span>Machine : <strong className="text-gray-800">{task.atelier} · {ATELIER_NAMES[task.atelier]}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>Début : <strong className="text-gray-800">{formatDateTime(start)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>Fin : <strong className="text-gray-800">{formatDateTime(end)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-gray-400" />
          <span>Durée : <strong className="text-gray-800">{formatDuration(task.duration)}</strong> ({task.lots} lot{task.lots > 1 ? 's' : ''})</span>
        </div>
      </div>
    </div>
  );
}

export default function GanttChart() {
  const { products } = useApp();
  const [hovered, setHovered] = useState(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const scrollRef = useRef(null);

  const schedule = useMemo(() => buildSchedule(products), [products]);
  const baseDate = useMemo(() => getBaseDate(), []);

  const totalHours = Math.ceil(schedule.spanHours / 24) * 24;
  const chartWidth = totalHours * PX_PER_HOUR;
  const totalDays = Math.ceil(totalHours / 24);

  const days = useMemo(
    () => Array.from({ length: totalDays }, (_, i) => ({
      idx: i,
      date: addHours(baseDate, i * 24),
      offset: i * 24 * PX_PER_HOUR,
      width: 24 * PX_PER_HOUR,
    })),
    [totalDays, baseDate]
  );

  const handleTaskEnter = (task, e) => {
    setHovered(task);
    setCursor({ x: e.clientX, y: e.clientY });
  };
  const handleTaskMove = (e) => {
    setCursor({ x: e.clientX, y: e.clientY });
  };
  const handleTaskLeave = () => setHovered(null);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-800">Planning Gantt — Ordonnancement Détaillé</h3>
        <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          Survolez une tâche pour voir les détails
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
        <LegendItem color="#3CC2B1" label="Production" />
        <LegendItem color={COLORS.idle} label="Temps mort" />
      </div>

      {/* Chart */}
      <div ref={scrollRef} className="overflow-x-auto overflow-y-visible">
        <div style={{ width: LABEL_WIDTH + chartWidth, minWidth: '100%' }}>
          {/* Time header */}
          <div className="flex sticky top-0 bg-white z-10" style={{ height: HEADER_HEIGHT }}>
            <div
              className="shrink-0 border-b border-gray-200 flex items-end pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              style={{ width: LABEL_WIDTH }}
            >
              Machine / Ressource
            </div>
            <div className="relative border-b border-gray-200" style={{ width: chartWidth }}>
              {days.map(d => (
                <div
                  key={d.idx}
                  className="absolute top-0 bottom-0 border-l border-gray-200"
                  style={{ left: d.offset, width: d.width }}
                >
                  <div className="text-[11px] font-semibold text-gray-700 px-2 pt-1 capitalize">
                    {formatDayLabel(d.date)}
                  </div>
                  <div className="flex text-[9px] text-gray-400 px-2">
                    <span className="flex-1">08:00</span>
                    <span className="flex-1 text-center">14:00</span>
                    <span className="flex-1 text-right">20:00</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {schedule.ateliers.map((atelier, rowIdx) => (
            <div key={atelier} className="flex" style={{ height: ROW_HEIGHT }}>
              {/* Row label */}
              <div
                className={`shrink-0 flex items-center gap-2 px-3 border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-gray-50/40' : ''}`}
                style={{ width: LABEL_WIDTH }}
              >
                <div className="w-8 h-8 rounded-lg bg-elm/10 flex items-center justify-center font-bold text-elm text-sm shrink-0">
                  {atelier}
                </div>
                <span className="text-xs text-gray-600 truncate">{ATELIER_NAMES[atelier]}</span>
              </div>

              {/* Row timeline */}
              <div
                className={`relative border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-gray-50/40' : ''}`}
                style={{ width: chartWidth, height: ROW_HEIGHT }}
              >
                {/* Day gridlines */}
                {days.map(d => (
                  <div
                    key={d.idx}
                    className="absolute top-0 bottom-0 border-l border-gray-200"
                    style={{ left: d.offset }}
                  />
                ))}
                {/* Hour minor grid (every 6h) */}
                {days.map(d => (
                  [6, 12, 18].map(h => (
                    <div
                      key={`${d.idx}-${h}`}
                      className="absolute top-0 bottom-0 border-l border-dashed border-gray-100"
                      style={{ left: d.offset + h * PX_PER_HOUR }}
                    />
                  ))
                ))}

                {/* Tasks */}
                {schedule.tasks
                  .filter(t => t.atelier === atelier)
                  .map((t) => {
                    const left = t.startHour * PX_PER_HOUR;
                    const totalW = (t.endHour - t.startHour) * PX_PER_HOUR;
                    const isHovered = hovered?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onMouseEnter={(e) => handleTaskEnter(t, e)}
                        onMouseMove={handleTaskMove}
                        onMouseLeave={handleTaskLeave}
                        className="absolute flex items-center rounded-md overflow-hidden shadow-sm cursor-pointer px-2 text-white text-[11px] font-semibold truncate"
                        style={{
                          left,
                          width: Math.max(totalW, 2),
                          top: 6,
                          height: ROW_HEIGHT - 14,
                          backgroundColor: t.color,
                          outline: isHovered ? '2px solid #1B6862' : 'none',
                          outlineOffset: 1,
                          zIndex: isHovered ? 5 : 1,
                        }}
                      >
                        {t.productName}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span><strong className="text-gray-700">{schedule.tasks.length}</strong> tâches planifiées</span>
        <span>·</span>
        <span><strong className="text-gray-700">{schedule.ateliers.length}</strong> machines actives</span>
        <span>·</span>
        <span>Horizon : <strong className="text-gray-700">{totalDays} j</strong> à partir du {formatDayLabel(baseDate)}</span>
      </div>

      <Tooltip task={hovered} baseDate={baseDate} x={cursor.x} y={cursor.y} />
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className="w-4 h-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
