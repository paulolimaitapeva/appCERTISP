
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Calendar, 
  LogOut,
  Building
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda / Pedidos', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'products', label: 'Produtos', icon: ShoppingBag },
    { id: 'acs', label: 'Autoridades (ACs)', icon: Building },
  ];

  return (
    <div className="w-64 bg-zinc-900 text-white flex flex-col h-screen sticky top-0 border-r border-zinc-800">
      <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex items-center justify-center">
        <h1 className="font-bold text-2xl tracking-tight text-zinc-100">CERTI SP</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/20' 
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-brand-400'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800 bg-black/20">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-red-900/20 hover:text-red-400 transition-colors group"
        >
          <LogOut className="w-5 h-5 group-hover:text-red-500 transition-colors" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
