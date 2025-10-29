

import React from 'react';
import { LayoutDashboard, Columns, Users, ClipboardList, Calendar, BarChart, Contact, PanelLeft, Settings, Zap } from 'lucide-react';

interface SidebarProps {
    activeView: string;
    onNavigate: (view: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Columns, label: 'Pipeline' },
    { icon: Users, label: 'Leads' },
    { icon: Contact, label: 'Clientes' },
    { icon: ClipboardList, label: 'Tarefas' },
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
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors leading-5 ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}>
        <item.icon className={`w-5 h-5 flex-shrink-0 text-violet-500 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
        {!isCollapsed && <span>{item.label}</span>}
    </a>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, isCollapsed, onToggle }) => {
  return (
    <aside className={`hidden md:flex flex-col bg-zinc-900 border-r border-zinc-800/80 p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-60'}`}>
      <div className={`flex items-center gap-3 mb-8 px-2 h-8 ${isCollapsed ? 'justify-center' : ''}`}>
         {!isCollapsed && (
             <h1 className="text-xl font-bold text-white whitespace-nowrap flex items-center gap-2">
                <Zap className="w-6 h-6 text-violet-500" />
                <span>CRM Fity AI</span>
             </h1>
         )}
         <button onClick={onToggle} className={`p-1 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 ${!isCollapsed ? 'ml-auto' : ''}`}>
            <PanelLeft className="w-6 h-6" />
         </button>
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

    </aside>
  );
};

export default Sidebar;