

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
      label: 'Contactos', 
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
      label: 'Analítica', 
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
    <nav className="w-20 bg-[#0B1120] flex flex-col items-center py-6 shrink-0 z-30 shadow-xl border-r border-slate-800/50 text-slate-400">
      
      {/* 1. Brand Logo at Top */}
      <div className="mb-8 group relative flex flex-col items-center cursor-pointer" onClick={() => onViewChange('BOARD')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20 text-white font-bold text-xl tracking-tighter">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
             <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
             <path d="M22 6l-10 7L2 6" />
           </svg>
        </div>
        {/* Tooltip */}
         <span className="absolute left-14 top-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium border border-slate-700">
            Edvolution CRM
        </span>
      </div>
      
      {/* 2. Main Navigation Ribbon */}
      <div className="flex flex-col gap-4 w-full px-2 items-center flex-1">
        {navItems.map((item) => {
           const isActive = (item.view === currentView);

           return (
            <button
                key={item.id}
                onClick={() => onViewChange(item.view as ViewMode)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative
                ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'hover:bg-slate-800/50 hover:text-blue-400'}
                `}
            >
                <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                
                {/* Tooltip */}
                <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium border border-slate-700">
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-400 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
            </button>
           )
        })}
      </div>

      {/* 3. Bottom Controls & Profile */}
      <div className="mt-auto flex flex-col gap-5 items-center">
        
        {/* Help Icon */}
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors group relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
          <span className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">
             Ayuda y Soporte
          </span>
        </button>

        <div className="w-8 h-px bg-slate-800"></div>

        {/* User Profile */}
        <div className="group relative pb-2">
            <button 
                onClick={() => onViewChange('SETTINGS')}
                className="relative block"
            >
                <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-blue-500 transition-all object-cover" 
                />
                <div className="absolute -bottom-0.5 -right-0.5 bg-[#0B1120] rounded-full p-0.5 border border-slate-700 group-hover:border-blue-500 transition-colors">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                </div>
            </button>
            <span className="absolute left-14 bottom-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700">
                {currentUser.name}
            </span>
        </div>
      </div>
    </nav>
  );
};