
import React from 'react';
import { ViewMode, User } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  currentUser: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, currentUser }) => {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Pipeline', 
      view: 'BOARD',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
        </svg>
      )
    },
    { 
      id: 'contacts', 
      label: 'Contacts', 
      view: 'CONTACTS',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <circle cx="12" cy="10" r="3"/>
          <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
        </svg>
      )
    },
    { 
      id: 'reports', 
      label: 'Analytics', 
      view: 'ANALYTICS', 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/>
          <path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      )
    }, 
  ];

  return (
    <nav className="w-20 bg-slate-900 flex flex-col items-center py-6 shrink-0 z-30 shadow-xl border-r border-slate-800/50">
      
      {/* 1. Profile at the Top (Settings Link) */}
      <div className="mb-6 group relative">
        <button 
            onClick={() => onViewChange('SETTINGS')}
            className="relative"
        >
            <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-10 h-10 rounded-xl border-2 border-slate-700 group-hover:border-blue-500 transition-all object-cover" 
            />
            <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-0.5 border border-slate-700 group-hover:bg-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            </div>
        </button>
        <span className="absolute left-14 top-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Settings & Profile
        </span>
      </div>

      <div className="w-8 h-px bg-slate-800 mb-6"></div>
      
      {/* 2. Main Navigation Ribbon */}
      <div className="flex flex-col gap-6 w-full px-2 items-center">
        {navItems.map((item) => {
           const isActive = (item.view === currentView);

           return (
            <button
                key={item.id}
                onClick={() => onViewChange(item.view as ViewMode)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative
                ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-110' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
            >
                <span className="text-xl">{item.icon}</span>
                {/* Tooltip */}
                <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium">
                {item.label}
                </span>
                {isActive && <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>}
            </button>
           )
        })}
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm text-slate-400 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors group relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
             Help & Support
          </span>
        </div>
      </div>
    </nav>
  );
};
