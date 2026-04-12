import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIAssistant from '../AIAssistant/AIAssistant';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { pdpLoaded } = useApp();

  if (!pdpLoaded) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafb]">
      <Sidebar />
      <main className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
      <AIAssistant />
    </div>
  );
}
