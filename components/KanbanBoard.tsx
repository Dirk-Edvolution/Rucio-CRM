import React from 'react';
import { Deal, Stage, STAGES } from '../types';
import { DealCard } from './DealCard';

interface KanbanBoardProps {
  deals: Deal[];
  onDragEnd: (dealId: string, newStage: Stage) => void;
  onOpenCanvas: (dealId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ deals, onDragEnd, onOpenCanvas }) => {
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, stage: Stage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData("dealId");
    if (dealId) {
      onDragEnd(dealId, stage);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex gap-6 h-full min-w-max pb-4">
      {STAGES.map((stage) => {
        const stageDeals = deals.filter((d) => d.stage === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);

        return (
          <div 
            key={stage.id} 
            className="w-80 flex flex-col h-full bg-slate-100/50 rounded-2xl border border-slate-200/60 shadow-sm"
            onDrop={(e) => handleDrop(e, stage.id)}
            onDragOver={handleDragOver}
          >
            {/* Column Header */}
            <div className="p-4 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-700">{stage.label}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${stage.color}`}>
                  {stageDeals.length}
                </span>
              </div>
              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${stage.color.split(' ')[0].replace('bg-', 'bg-') || 'bg-slate-400'}`} style={{width: '60%'}}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">
                ${totalValue.toLocaleString()}
              </p>
            </div>

            {/* Cards Container */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3 no-scrollbar">
              {stageDeals.map((deal) => (
                <DealCard 
                  key={deal.id} 
                  deal={deal} 
                  onOpenCanvas={() => onOpenCanvas(deal.id)}
                />
              ))}
              {stageDeals.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm">
                  Drop here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};