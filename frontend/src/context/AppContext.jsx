import { createContext, useContext, useMemo, useState } from 'react';
import { PRODUCTS, DEFAULT_PARAMS, DEFAULT_ATELIER_PARAMS, getAtelierUtilization } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [atelierParams, setAtelierParams] = useState(DEFAULT_ATELIER_PARAMS);
  const [pdpLoaded, setPdpLoaded] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePlanName, setActivePlanName] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);

  const utilization = useMemo(
    () => getAtelierUtilization(products, params, atelierParams),
    [products, params, atelierParams]
  );

  const { overloaded, nearCapacity, healthy, healthScore } = useMemo(() => {
    const over = utilization.filter(u => u.utilization > 100);
    const near = utilization.filter(u => u.utilization >= 80 && u.utilization <= 100);
    const ok = utilization.filter(u => u.utilization < 80);
    const score = over.length === 0
      ? (near.length === 0 ? 'excellent' : 'good')
      : 'critical';
    return { overloaded: over, nearCapacity: near, healthy: ok, healthScore: score };
  }, [utilization]);

  const loadDemoData = () => {
    setProducts(PRODUCTS);
    setPdpLoaded(true);
    setFileName('PDP_Teriak_2024_Q2.xlsx');
  };

  const resetPdp = () => {
    setProducts(PRODUCTS);
    setPdpLoaded(false);
    setFileName(null);
    setActivePlanId(null);
    setActivePlanName(null);
    setAiMessages([]);
  };

  // Called by DropZone (after backend upload) and by ScenarioManager (after /api/pdp/{id} load)
  const loadPlanFromBackend = (planDetail) => {
    if (!planDetail || !Array.isArray(planDetail.products)) return;
    // Re-hydrate products — ensure each has an id
    const hydrated = planDetail.products.map((p, i) => ({
      ...p,
      id: p.id || i + 1,
      processingTimes: p.processingTimes || {},
      gamme: p.gamme || [],
    }));
    setProducts(hydrated);
    setPdpLoaded(true);
    setFileName(planDetail.filename || planDetail.name);
    setActivePlanId(planDetail.id);
    setActivePlanName(planDetail.name);
  };

  const updateAtelierParam = (atelier, key, value) => {
    setAtelierParams(prev => ({
      ...prev,
      [atelier]: { ...prev[atelier], [key]: value },
    }));
  };

  const resetAtelierParams = () => setAtelierParams(DEFAULT_ATELIER_PARAMS);

  const loadExcelData = (parsedProducts, name) => {
    setProducts(parsedProducts);
    setPdpLoaded(true);
    setFileName(name);
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const addAiMessage = (msg) => {
    setAiMessages(prev => [...prev, msg]);
  };

  return (
    <AppContext.Provider value={{
      products,
      params,
      utilization,
      overloaded,
      nearCapacity,
      healthy,
      healthScore,
      pdpLoaded,
      fileName,
      aiMessages,
      activePlanId,
      activePlanName,
      loadDemoData,
      loadExcelData,
      loadPlanFromBackend,
      resetPdp,
      updateParam,
      atelierParams,
      updateAtelierParam,
      resetAtelierParams,
      addAiMessage,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
