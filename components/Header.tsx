import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Bell, TrendingUp, User as UserIcon, ClipboardList, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../types';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onOpenCreateLeadModal: () => void;
    onOpenCreateTaskModal: () => void;
    theme: 'dark' | 'light';
    onThemeToggle: () => void;
    unreadCount: number;
}

const Header: React.FC<HeaderProps> = ({ 
    currentUser, 
    onLogout, 
    searchQuery, 
    onSearchChange, 
    onOpenCreateLeadModal, 
    onOpenCreateTaskModal,
    theme,
    onThemeToggle,
    unreadCount
}) => {
    const [isCreateMenuOpen, setCreateMenuOpen] = useState(false);
    const [isUserMenuOpen, setUserMenuOpen] = useState(false);

    const createMenuRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setCreateMenuOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const createMenuItems = [
        { label: 'Novo Lead', icon: TrendingUp, action: onOpenCreateLeadModal, shortcut: 'L' },
        { label: 'Novo Cliente', icon: UserIcon, action: onOpenCreateLeadModal, shortcut: 'C' },
        { label: 'Nova Atividade', icon: ClipboardList, action: onOpenCreateTaskModal, shortcut: 'A' },
    ];

    return (
        <header className="flex-shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 px-6 h-16 flex items-center justify-between z-30">
            {/* Left Side - Search */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <input
                    type="text"
                    placeholder="Buscar leads, clientes, atividades... (⌘K)"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md pl-9 pr-4 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                />
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center gap-2">
                {/* Create Button */}
                <div className="relative" ref={createMenuRef}>
                    <button
                        onClick={() => setCreateMenuOpen(prev => !prev)}
                        className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-violet-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Criar</span>
                    </button>
                    <AnimatePresence>
                        {isCreateMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-20 py-1"
                            >
                                {createMenuItems.map(item => (
                                     <button
                                        key={item.label}
                                        onClick={() => { item.action(); setCreateMenuOpen(false); }}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <item.icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                            <span>{item.label}</span>
                                        </div>
                                        <kbd className="font-sans text-xs text-zinc-400 dark:text-zinc-500">⌘{item.shortcut}</kbd>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Theme Toggle Button */}
                <button onClick={onThemeToggle} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-colors">
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
                 <button className="relative p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                         <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-white text-xs font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* User Menu */}
                 <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setUserMenuOpen(p => !p)}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-transparent hover:ring-violet-500 transition-shadow">
                            {currentUser.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    </button>
                     <AnimatePresence>
                        {isUserMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-20"
                            >
                                <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
                                    <p className="font-semibold text-sm text-zinc-900 dark:text-white truncate">{currentUser.name}</p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{currentUser.email}</p>
                                </div>
                                <div className="p-1">
                                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-md">
                                        <LogOut className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <span>Sair</span>
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