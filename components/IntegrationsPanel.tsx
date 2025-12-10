import React, { useState } from 'react';
import { Deal } from '../types';
import { generateEmailFollowUp } from '../services/geminiService';

interface IntegrationsPanelProps {
  activeDeal?: Deal;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ activeDeal }) => {
    const [emailDraft, setEmailDraft] = useState<string | null>(null);
    const [loadingEmail, setLoadingEmail] = useState(false);

    const handleGenerateEmail = async (type: 'check-in' | 'proposal-delivery') => {
        if (!activeDeal) return;
        setLoadingEmail(true);
        const draft = await generateEmailFollowUp(activeDeal, type);
        setEmailDraft(draft);
        setLoadingEmail(false);
    };

    if (!activeDeal) {
        return (
            <div className="p-6 text-center h-full flex flex-col items-center justify-center text-slate-400">
                <span className="text-4xl mb-4">📎</span>
                <p className="text-sm">Select a deal to view related emails, calendar events, and notes.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Deal Context</h3>
                <p className="text-xs text-slate-500">{activeDeal.title}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Gmail Integration Mock */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-red-50 p-3 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <span className="text-lg">📧</span>
                             <span className="font-medium text-red-900 text-sm">Gmail</span>
                        </div>
                        <button className="text-xs text-red-700 hover:underline">Compose</button>
                    </div>
                    <div className="p-4">
                         {emailDraft ? (
                             <div className="mb-4">
                                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap mb-2">
                                     {emailDraft}
                                 </div>
                                 <div className="flex justify-end gap-2">
                                     <button onClick={() => setEmailDraft(null)} className="text-xs text-slate-500 hover:text-slate-800">Discard</button>
                                     <button className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Send</button>
                                 </div>
                             </div>
                         ) : (
                             <div className="space-y-2 mb-4">
                                 <button 
                                   onClick={() => handleGenerateEmail('check-in')}
                                   disabled={loadingEmail}
                                   className="w-full text-left text-xs p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
                                 >
                                     ✨ Draft Check-in Email
                                 </button>
                                 <button 
                                   onClick={() => handleGenerateEmail('proposal-delivery')}
                                   disabled={loadingEmail}
                                   className="w-full text-left text-xs p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
                                 >
                                     ✨ Draft Proposal Email
                                 </button>
                                 {loadingEmail && <div className="text-xs text-blue-600 animate-pulse text-center">Generating...</div>}
                             </div>
                         )}

                         <div className="space-y-3">
                             <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Recent Thread</div>
                             <div className="flex gap-3">
                                 <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">JD</div>
                                 <div className="min-w-0">
                                     <p className="text-xs font-bold text-slate-800">John Doe</p>
                                     <p className="text-xs text-slate-500 truncate">Re: Meeting confirmation for Tuesday...</p>
                                     <p className="text-[10px] text-slate-400 mt-1">2 days ago</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Calendar Integration Mock */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-blue-50 p-3 border-b border-blue-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-lg">📅</span>
                             <span className="font-medium text-blue-900 text-sm">Calendar</span>
                        </div>
                        <button className="text-xs text-blue-700 hover:underline">Add</button>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex gap-3 items-start p-2 rounded hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex flex-col items-center bg-white border border-slate-200 rounded px-1.5 py-1">
                                <span className="text-[10px] font-bold text-red-500 uppercase">Oct</span>
                                <span className="text-sm font-bold text-slate-800">24</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">Follow-up Call</p>
                                <p className="text-xs text-slate-500">10:00 AM - 10:30 AM</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keep/Notes Integration Mock */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-yellow-50 p-3 border-b border-yellow-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <span className="text-lg">💡</span>
                             <span className="font-medium text-yellow-900 text-sm">Keep</span>
                        </div>
                    </div>
                    <div className="p-4 grid gap-3">
                        <div className="bg-yellow-50/50 p-3 rounded border border-yellow-100/50 text-xs text-slate-700">
                             Remember to mention the Q4 discount for volume licensing.
                        </div>
                         <div className="bg-white p-2 border border-slate-200 rounded text-xs text-slate-400 italic">
                             + Add note...
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};