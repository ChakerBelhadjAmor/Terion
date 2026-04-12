import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIAssistant from '../AIAssistant/AIAssistant';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { activePlanId } = useApp();
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main key={activePlanId || 'default'} className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
      <AIAssistant />
    </div>
  );
}
