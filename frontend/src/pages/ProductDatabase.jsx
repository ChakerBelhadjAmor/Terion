import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, ChevronRight, Clock, Layers, ArrowRight } from 'lucide-react';
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

  return (
    <div className="p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-gray-900">Base de Données Produits</h1>
        </div>
        <p className="text-gray-400 text-sm">{products.length} produits · Gammes de fabrication et temps de passage</p>
      </motion.div>

      <div className="flex gap-6">
        {/* Left: Table */}
        <div className="flex-1">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit, DCI, forme..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm"
            />
          </div>

          {/* List */}
          <div className="space-y-2">
            {filtered.map((product, i) => {
              const totalHours = product.gamme.reduce((s, a) => s + (product.processingTimes[a] || 0) * product.lots, 0);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(product.id === selected ? null : product.id)}
                  className={`bg-white rounded-xl border shadow-card cursor-pointer transition-all hover:shadow-card-hover ${
                    selected === product.id ? 'border-primary ring-1 ring-primary/20' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-4 px-4 py-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: product.color + '20' }}
                    >
                      <span className="text-sm font-bold" style={{ color: product.color }}>
                        {product.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{product.dci} · {product.form}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className="text-lg font-extrabold text-elm">{product.lots}</p>
                        <p className="text-xs text-gray-400">lots</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">{product.gamme.length}</p>
                        <p className="text-xs text-gray-400">ateliers</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">{totalHours}h</p>
                        <p className="text-xs text-gray-400">charge tot.</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${selected === product.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Gamme pills */}
                  <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                    {product.gamme.map((atelier, idx) => (
                      <span key={atelier} className="flex items-center gap-1">
                        {idx > 0 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                        <span
                          className="px-2 py-0.5 rounded-md text-xs font-bold"
                          style={{ backgroundColor: product.color + '20', color: product.color }}
                        >
                          {atelier}
                        </span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Detail panel */}
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-80 shrink-0"
          >
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 sticky top-8 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100" style={{ background: selectedProduct.color + '10' }}>
                <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center text-xl font-extrabold text-white"
                  style={{ backgroundColor: selectedProduct.color }}>
                  {selectedProduct.name.charAt(0)}
                </div>
                <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-sm text-gray-500">{selectedProduct.dci}</p>
                <span className="mt-2 inline-block px-2 py-0.5 bg-white rounded-lg text-xs text-gray-500 border border-gray-200">
                  {selectedProduct.form}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 border-b border-gray-100">
                <div className="p-4 text-center">
                  <p className="text-2xl font-extrabold text-elm">{selectedProduct.lots}</p>
                  <p className="text-xs text-gray-400 mt-1">Lots PDP</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-extrabold text-primary">{selectedProduct.gamme.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Ateliers</p>
                </div>
              </div>

              {/* Gamme details */}
              <div className="p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Gamme de fabrication
                </p>
                <div className="space-y-2">
                  {selectedProduct.gamme.map((atelier, idx) => (
                    <div key={atelier} className="flex items-center gap-3">
                      {idx < selectedProduct.gamme.length - 1 && (
                        <div className="absolute mt-8 ml-3.5 w-px h-6 bg-gray-100" />
                      )}
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                        style={{ backgroundColor: selectedProduct.color }}
                      >
                        {atelier}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-700">{ATELIER_NAMES[atelier]}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{selectedProduct.processingTimes[atelier]}h/lot</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
