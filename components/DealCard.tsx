import React from 'react';
import { Deal } from '../types';

interface DealCardProps {
  deal: Deal;
  onOpenCanvas: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onOpenCanvas }) => {
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("dealId", deal.id);
    e.dataTransfer.effectAllowed = "move";
  };

  // Allow opening workspace for Discover phase onwards
  const showWorkspaceButton = ['DISCOVER', 'UNDERSTAND', 'PROPOSAL', 'NEGOTIATING'].includes(deal.stage);

  // Helper for health colors
  const getHealthColor = () => {
    switch (deal.health) {
      case 'HEALTHY': return 'bg-emerald-500';
      case 'AT_RISK': return 'bg-amber-500';
      case 'CRITICAL': return 'bg-rose-500';
      default: return 'bg-slate-300';
    }
  };

  const getHealthTextColor = () => {
    switch (deal.health) {
      case 'HEALTHY': return 'text-emerald-700';
      case 'AT_RISK': return 'text-amber-700';
      case 'CRITICAL': return 'text-rose-700';
      default: return 'text-slate-500';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-move hover:shadow-md transition-shadow group relative overflow-visible"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{deal.company}</span>
        {showWorkspaceButton && (
           <button 
             onClick={(e) => { e.stopPropagation(); onOpenCanvas(); }}
             className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 shadow-lg z-10"
             title="Open Workspace"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
           </button>
        )}
      </div>
      
      <h4 className="font-semibold text-slate-800 text-sm mb-3 leading-snug">{deal.title}</h4>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {deal.tags.map(tag => (
          <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-50 relative">
        <span className="font-medium text-slate-700">${deal.value.toLocaleString()}</span>
        
        {/* Health Indicator & Clock */}
        <div className="relative group/health cursor-help flex items-center gap-1.5 p-1 -mr-1 rounded hover:bg-slate-50 transition-colors">
            {/* Traffic Light Dot */}
            <div className={`w-2 h-2 rounded-full ${getHealthColor()} shadow-sm`}></div>
            
            {/* Time */}
            <div className={`flex items-center gap-1 ${getHealthTextColor()}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="font-medium">{deal.lastContact}</span>
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 opacity-0 group-hover/health:opacity-100 transition-all pointer-events-none z-50 translate-y-2 group-hover/health:translate-y-0 duration-200">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                    <span className="text-lg">🤖</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rucio Insight</span>
                </div>
                
                {/* Recommended Next Step (Green) */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 mb-2">
                    <p className="text-xs text-emerald-700 font-semibold leading-snug">
                       {deal.aiNextStep}
                    </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="uppercase tracking-wide font-medium">Status: {deal.health.replace('_', ' ')}</span>
                    <span>{deal.daysDormant === 0 ? 'Active today' : `${deal.daysDormant} days dormant`}</span>
                </div>

                {/* Arrow */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
            </div>
        </div>
      </div>
      
      {/* Probability Bar */}
      <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
            className={`h-full ${deal.probability > 75 ? 'bg-green-500' : deal.probability > 40 ? 'bg-blue-500' : 'bg-yellow-500'}`} 
            style={{ width: `${deal.probability}%` }}
        ></div>
      </div>
    </div>
  );
};