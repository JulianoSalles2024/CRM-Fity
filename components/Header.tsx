
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../types';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    unreadCount: number;
}

const Header: React.FC<HeaderProps> = ({ 
    currentUser, 
    onLogout, 
    searchQuery, 
    onSearchChange, 
    theme,
    onThemeToggle,
    unreadCount
}) => {
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex-shrink-0 bg-transparent px-6 h-20 flex items-center justify-between z-30">
            {/* Left Side - Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar leads, clientes, atividades... (⌘K)"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-sm"
                />
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle Button */}
                <button onClick={onThemeToggle} className="p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={theme}
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </motion.div>
                    </AnimatePresence>
                </button>


                {/* Notifications Button */}
                 <button className="relative p-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                         <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-slate-950"></span>
                    )}
                </button>

                {/* User Menu */}
                 <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setUserMenuOpen(p => !p)} className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                            <p className="text-xs text-slate-500">Admin</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-bold text-sm text-white shadow-lg shadow-blue-900/20">
                            {currentUser.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    </button>
                     <AnimatePresence>
                        {isUserMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute top-full right-0 mt-2 w-64 bg-slate-900 rounded-xl border border-slate-800 shadow-xl shadow-slate-950/50 z-50 overflow-hidden"
                            >
                                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                                    <p className="font-semibold text-sm text-white truncate">{currentUser.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                                </div>
                                <div className="p-1">
                                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                                        <LogOut className="w-4 h-4" />
                                        <span>Sair da conta</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
