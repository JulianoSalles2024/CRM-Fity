
import React from 'react';
import { LayoutDashboard, Columns, Users, Activity, Calendar, BarChart, Contact, PanelLeft, LogOut, Settings } from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    currentUser: User;
    onLogout: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Columns, label: 'Pipeline' },
    { icon: Users, label: 'Leads' },
    { icon: Contact, label: 'Clientes' },
    { icon: Activity, label: 'Atividades' },
    { icon: Calendar, label: 'Calendário' },
    { icon: BarChart, label: 'Relatórios' },
    { icon: Settings, label: 'Configurações' },
];

const NavItem: React.FC<{
    item: {icon: React.ElementType, label: string},
    isActive: boolean,
    isCollapsed: boolean,
    onClick: () => void,
}> = ({ item, isActive, isCollapsed, onClick }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }}
        title={isCollapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}>
        <item.icon className={`w-5 h-5 flex-shrink-0 text-[#14ff00] ${isActive ? 'opacity-100' : 'opacity-70'}`} />
        {!isCollapsed && <span>{item.label}</span>}
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, currentUser, onLogout, isCollapsed, onToggle }) => {
  return (
    <aside className={`hidden md:flex flex-col bg-zinc-900 border-r border-zinc-800/80 p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-60'}`}>
      <div className={`flex items-center gap-3 mb-8 px-2 ${isCollapsed ? 'justify-center' : ''}`}>
         <button onClick={onToggle} className="p-1 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-600">
            <PanelLeft className="w-6 h-6 text-[#14ff00]" />
         </button>
         {!isCollapsed && (
             <h1 className="text-xl font-bold text-white whitespace-nowrap">CRM <span style={{ color: '#14ff00' }}>Fity AI</span></h1>
         )}
      </div>

      <nav className="flex-1">
        <ul className="space-y-1">
            {navItems.map((item) => (
                <li key={item.label}>
                    <NavItem item={item} isActive={activeView === item.label} onClick={() => onNavigate(item.label)} isCollapsed={isCollapsed} />
                </li>
            ))}
        </ul>
      </nav>

      <div className="border-t border-zinc-800/80 pt-4 mt-4">
        <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'flex-col' : ''}`}>
            <div title={isCollapsed ? currentUser.name : undefined} className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            {!isCollapsed && (
                <div className="overflow-hidden flex-1">
                    <p className="font-semibold text-sm text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                </div>
            )}
            <button onClick={onLogout} title="Sair" className={`p-2 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors ${!isCollapsed ? 'ml-auto flex-shrink-0' : ''}`}>
                <LogOut className="w-4 h-4 text-[#14ff00]/70 hover:text-[#14ff00]" />
            </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
