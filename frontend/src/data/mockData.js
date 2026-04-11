export const ATELIERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const ATELIER_NAMES = {
  A: 'Pesée & Granulation',
  B: 'Compression',
  C: 'Enrobage',
  D: 'Remplissage Aseptique',
  E: 'Stérilisation',
  F: 'Lyophilisation',
  G: 'Conditionnement Primaire',
  H: 'Conditionnement Secondaire',
  I: 'Contrôle Qualité',
  J: 'Libération & Stockage',
};

export const PRODUCTS = [
  {
    id: 1,
    name: 'Lotentin 100mg',
    dci: 'Amlodipine',
    form: 'Comprimé pelliculé',
    lots: 8,
    gamme: ['A', 'B', 'C', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 6, B: 4, C: 8, G: 3, H: 3, I: 10, J: 2 },
    color: '#3CC2B1',
  },
  {
    id: 2,
    name: 'Cardiofix 50mg',
    dci: 'Metoprolol',
    form: 'Comprimé',
    lots: 6,
    gamme: ['A', 'B', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 5, B: 3, G: 2, H: 2, I: 8, J: 2 },
    color: '#5dd0c1',
  },
  {
    id: 3,
    name: 'Nervolan XR 75mg',
    dci: 'Venlafaxine',
    form: 'Gélule LP',
    lots: 5,
    gamme: ['A', 'B', 'C', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 7, B: 5, C: 10, G: 3, H: 3, I: 12, J: 2 },
    color: '#1B6862',
  },
  {
    id: 4,
    name: 'Hepatol Plus',
    dci: 'Silymarine',
    form: 'Comprimé enrobé',
    lots: 4,
    gamme: ['A', 'B', 'C', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 4, B: 3, C: 6, G: 2, H: 2, I: 8, J: 2 },
    color: '#FBB829',
  },
  {
    id: 5,
    name: 'Respirex Injectable',
    dci: 'Salbutamol',
    form: 'Solution injectable',
    lots: 10,
    gamme: ['D', 'E', 'G', 'H', 'I', 'J'],
    processingTimes: { D: 8, E: 12, G: 4, H: 4, I: 14, J: 2 },
    color: '#e0a020',
  },
  {
    id: 6,
    name: 'Ostéomax 1000mg',
    dci: 'Calcium + Vit D3',
    form: 'Comprimé effervescent',
    lots: 7,
    gamme: ['A', 'B', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 5, B: 4, G: 3, H: 3, I: 10, J: 2 },
    color: '#2fa898',
  },
  {
    id: 7,
    name: 'Lyocef 1g',
    dci: 'Céfazoline',
    form: 'Poudre lyophilisée',
    lots: 12,
    gamme: ['D', 'F', 'G', 'H', 'I', 'J'],
    processingTimes: { D: 6, F: 24, G: 4, H: 4, I: 16, J: 2 },
    color: '#134e4a',
  },
  {
    id: 8,
    name: 'Glucoter 500mg',
    dci: 'Metformine',
    form: 'Comprimé pelliculé',
    lots: 9,
    gamme: ['A', 'B', 'C', 'G', 'H', 'I', 'J'],
    processingTimes: { A: 6, B: 4, C: 7, G: 3, H: 3, I: 10, J: 2 },
    color: '#3CC2B1',
  },
];

export const DEFAULT_PARAMS = {
  weeks: 4,
};

// Per-atelier params — each atelier can differ
export const DEFAULT_ATELIER_PARAMS = Object.fromEntries(
  ATELIERS.map(a => [a, { daysPerWeek: 5, shiftsPerDay: 2, hoursPerShift: 8, efficiency: 85 }])
);

export function computeCapacityForAtelier(globalParams, atelierOverride = {}) {
  const daysPerWeek = atelierOverride.daysPerWeek ?? 5;
  const shiftsPerDay = atelierOverride.shiftsPerDay ?? 2;
  const hoursPerShift = atelierOverride.hoursPerShift ?? 8;
  const efficiency = atelierOverride.efficiency ?? 85;
  return globalParams.weeks * daysPerWeek * shiftsPerDay * hoursPerShift * (efficiency / 100);
}

// Keep backward compat for any code still using computeCapacity
export function computeCapacity(params) {
  const { weeks, daysPerWeek = 5, shiftsPerDay = 2, hoursPerShift = 8, efficiency = 85 } = params;
  return weeks * daysPerWeek * shiftsPerDay * hoursPerShift * (efficiency / 100);
}

export function computeLoads(products = PRODUCTS) {
  const loads = {};
  ATELIERS.forEach(a => { loads[a] = 0; });
  products.forEach(product => {
    product.gamme.forEach(atelier => {
      loads[atelier] += (product.lots * (product.processingTimes[atelier] || 0));
    });
  });
  return loads;
}

export function getAtelierUtilization(products, globalParams, atelierParams = DEFAULT_ATELIER_PARAMS) {
  const loads = computeLoads(products);
  return ATELIERS.map(atelier => {
    const ap = atelierParams[atelier] || DEFAULT_ATELIER_PARAMS[atelier];
    const capacity = computeCapacityForAtelier(globalParams, ap);
    return {
      atelier,
      name: ATELIER_NAMES[atelier],
      load: Math.round(loads[atelier] * 10) / 10,
      capacity: Math.round(capacity * 10) / 10,
      utilization: capacity > 0 ? Math.round((loads[atelier] / capacity) * 1000) / 10 : 0,
    };
  });
}

// Gantt data: lot schedule across weeks
export function generateGanttData(products = PRODUCTS) {
  const ganttRows = [];
  let weekOffset = 0;
  products.forEach(product => {
    const lotsPerWeek = Math.ceil(product.lots / 4);
    for (let week = 1; week <= 4; week++) {
      const lotsThisWeek = Math.min(lotsPerWeek, product.lots - (week - 1) * lotsPerWeek);
      if (lotsThisWeek <= 0) continue;
      product.gamme.forEach((atelier, idx) => {
        ganttRows.push({
          productId: product.id,
          productName: product.name,
          atelier,
          atelierName: ATELIER_NAMES[atelier],
          week,
          duration: product.processingTimes[atelier] || 0,
          color: product.color,
          lots: lotsThisWeek,
        });
      });
    }
  });
  return ganttRows;
}
