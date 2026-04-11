import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AIAssistant from '../AIAssistant/AIAssistant';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto scrollbar-thin">
        <Outlet />
      </main>
      <AIAssistant />
    </div>
  );
}
