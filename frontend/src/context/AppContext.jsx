import { createContext, useContext, useState } from 'react';
import { PRODUCTS, DEFAULT_PARAMS, DEFAULT_ATELIER_PARAMS, getAtelierUtilization } from '../data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [atelierParams, setAtelierParams] = useState(DEFAULT_ATELIER_PARAMS);
  const [pdpLoaded, setPdpLoaded] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);

  const utilization = getAtelierUtilization(products, params, atelierParams);
  const overloaded = utilization.filter(u => u.utilization > 100);
  const nearCapacity = utilization.filter(u => u.utilization >= 80 && u.utilization <= 100);
  const healthy = utilization.filter(u => u.utilization < 80);

  const healthScore = overloaded.length === 0
    ? (nearCapacity.length === 0 ? 'excellent' : 'good')
    : 'critical';

  const loadDemoData = () => {
    setProducts(PRODUCTS);
    setPdpLoaded(true);
    setFileName('PDP_Terion_2024_Q2.xlsx');
  };

  const resetPdp = () => {
    setProducts(PRODUCTS);
    setPdpLoaded(false);
    setFileName(null);
    setAiMessages([]);
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
      loadDemoData,
      loadExcelData,
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
