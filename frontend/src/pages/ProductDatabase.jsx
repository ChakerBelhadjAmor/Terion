import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, ChevronRight, Clock, Layers, ArrowRight, X, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ATELIER_NAMES } from '../data/mockData';

export default function ProductDatabase() {
  const { products } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.dci || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.form || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selected);

  const totalLots = products.reduce((s, p) => s + (p.lots || 1), 0);
  const totalHoursAll = products.reduce((s, p) =>
    s + p.gamme.reduce((ss, a) => ss + (p.processingTimes[a] || 0) * p.lots, 0), 0
  );

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Base de Données Produits</h1>
        </div>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-gray-400 text-sm">{products.length} produits · {totalLots} lots · {totalHoursAll}h de charge totale</p>
        </div>
      </motion.div>

      <div className="flex gap-6">
        {/* Left: Table */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit, DCI, forme..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {search && (
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} pour « {search} »
            </p>
          )}

          {/* List */}
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((product, i) => {
                const totalHours = product.gamme.reduce((s, a) => s + (product.processingTimes[a] || 0) * product.lots, 0);
                const isSelected = selected === product.id;
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelected(isSelected ? null : product.id)}
                    className={`bg-white rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-card ${
                      isSelected ? 'border-primary ring-2 ring-primary/15' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4 px-4 py-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                        style={{ backgroundColor: product.color + '18' }}
                      >
                        <span className="text-sm font-bold" style={{ color: product.color }}>
                          {product.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {product.dci || '—'}{product.form ? ` · ${product.form}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-5 text-right shrink-0">
                        <div>
                          <p className="text-lg font-extrabold text-elm leading-none">{product.lots}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">lots</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary leading-none">{product.gamme.length}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">ateliers</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700 leading-none">{totalHours}h</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">charge</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isSelected ? 'rotate-90 text-primary' : ''}`} />
                      </div>
                    </div>

                    {/* Gamme pills */}
                    <div className="px-4 pb-3 flex gap-1 flex-wrap">
                      {product.gamme.map((atelier, idx) => (
                        <span key={atelier} className="flex items-center gap-0.5">
                          {idx > 0 && <ArrowRight className="w-2.5 h-2.5 text-gray-300" />}
                          <span
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ backgroundColor: product.color + '15', color: product.color }}
                          >
                            {atelier}
                          </span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">Aucun produit trouvé</p>
                <p className="text-gray-300 text-sm mt-1">Essayez un autre terme de recherche</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 shrink-0"
            >
              <div className="bg-white rounded-2xl shadow-card border border-gray-100 sticky top-8 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${selectedProduct.color}08, ${selectedProduct.color}15)` }}>
                  <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-xl font-extrabold text-white shadow-md"
                    style={{ backgroundColor: selectedProduct.color }}>
                    {selectedProduct.name.charAt(0)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedProduct.dci}</p>
                  {selectedProduct.form && (
                    <span className="mt-2 inline-block px-2.5 py-1 bg-white/80 rounded-lg text-xs text-gray-500 border border-gray-100 font-medium">
                      {selectedProduct.form}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="p-4 text-center">
                    <p className="text-2xl font-extrabold text-elm">{selectedProduct.lots}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Lots PDP</p>
                  </div>
                  <div className="p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{selectedProduct.gamme.length}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Ateliers</p>
                  </div>
                </div>

                {/* Gamme details */}
                <div className="p-5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Gamme de fabrication
                  </p>
                  <div className="space-y-1">
                    {selectedProduct.gamme.map((atelier, idx) => (
                      <div key={atelier} className="flex items-center gap-3 py-1.5 group">
                        <div className="relative">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold text-white shrink-0"
                            style={{ backgroundColor: selectedProduct.color }}
                          >
                            {atelier}
                          </div>
                          {idx < selectedProduct.gamme.length - 1 && (
                            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-3" style={{ backgroundColor: selectedProduct.color + '30' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 truncate">{ATELIER_NAMES[atelier]}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 group-hover:text-gray-600 transition-colors">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{selectedProduct.processingTimes[atelier]}h</span>
                          <span className="text-gray-300">/lot</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Charge totale</span>
                    <span className="text-sm font-extrabold text-elm">
                      {selectedProduct.gamme.reduce((s, a) => s + (selectedProduct.processingTimes[a] || 0) * selectedProduct.lots, 0)}h
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
