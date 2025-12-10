
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Resource, Contact, LineItem, OdooLink, ApprovalStatus, BuyingRole } from '../types';
import { generateProposalDraft, generateExecutiveSummary, generateWeeklyDigest, analyzeScreenshot, getBattleCard } from '../services/geminiService';
import { getOdooCompanyForDeal, createSalesOrder } from '../services/odooService';

interface CanvasWorkspaceProps {
  deal: Deal;
  contacts: Contact[];
  onClose: () => void;
  onUpdateDeal: (deal: Deal) => void;
  onOpenContacts: () => void;
}

type Tab = 'DISCOVERY' | 'OVERVIEW' | 'LIVE_ASSIST' | 'PROPOSAL' | 'BID_COUNCIL' | 'STAKEHOLDERS';
type DiscoveryMode = 'ACTIVITY' | 'ASSETS';

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ deal, contacts, onClose, onUpdateDeal, onOpenContacts }) => {
  const [activeTab, setActiveTab] = useState<Tab>(deal.stage === 'DISCOVER' ? 'DISCOVERY' : deal.stage === 'PROPOSAL' ? 'PROPOSAL' : 'OVERVIEW');
  const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>('ACTIVITY');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalText, setProposalText] = useState(deal.proposalContent || '');
  const [resources, setResources] = useState<Resource[]>(deal.resources || []);
  
  // Magic Dropzone State
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [magicAnalysis, setMagicAnalysis] = useState<{context: string, intelligence: string, suggestedAction: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Assist State
  const [isLive, setIsLive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [battleCard, setBattleCard] = useState<string | null>(null);

  // Overview State
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isDigesting, setIsDigesting] = useState(false);
  const [isChangingContact, setIsChangingContact] = useState(false);

  // Odoo State
  const [isCreatingSO, setIsCreatingSO] = useState(false);
  const [odooCompany, setOdooCompany] = useState(getOdooCompanyForDeal(deal.country));
  
  // Bid Council State
  const [psCost, setPsCost] = useState(Math.round(deal.value * 0.15));
  const [opsCost, setOpsCost] = useState(Math.round(deal.value * 0.05));
  
  // Sync internal resources state if deal changes
  useEffect(() => {
    setResources(deal.resources || []);
    // Reset costs estimates based on new deal value
    setPsCost(Math.round(deal.value * 0.15));
    setOpsCost(Math.round(deal.value * 0.05));
  }, [deal.id, deal.value]);

  useEffect(() => {
      // Re-evaluate Odoo company if deal country changes (in a real app)
      setOdooCompany(getOdooCompanyForDeal(deal.country));
  }, [deal.country]);

  // --- Live Assist Simulation ---
  useEffect(() => {
    let interval: any;
    if (isLive) {
        const simulatedConversation = [
            { speaker: 'Client', text: "Thanks for joining. To be honest, we're looking at AWS as well." },
            { speaker: 'Rep', text: "Understood. AWS is a strong player." },
            { speaker: 'Client', text: "Yeah, their pricing seems a bit more flexible for our volume." },
            { speaker: 'Client', text: "And we are worried about the migration timeline." },
            { speaker: 'Rep', text: "Can you tell me more about the timeline constraints?" },
            { speaker: 'Client', text: "We need to be live by Q1 or we lose budget." }
        ];
        let index = 0;
        interval = setInterval(async () => {
            if (index < simulatedConversation.length) {
                const line = simulatedConversation[index];
                setTranscript(prev => [...prev, `${line.speaker}: ${line.text}`]);
                
                // Trigger Battle Cards
                if (line.text.includes("AWS") || line.text.includes("pricing")) {
                     const card = await getBattleCard("Competitor: AWS + Pricing Objection", deal.description);
                     setBattleCard(card);
                } else if (line.text.includes("timeline") || line.text.includes("Q1")) {
                     const card = await getBattleCard("Objection: Timeline Pressure", deal.description);
                     setBattleCard(card);
                }

                index++;
            } else {
                clearInterval(interval);
            }
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive, deal.description]);


  const handleGenerateProposal = async () => {
    setIsGenerating(true);
    const content = await generateProposalDraft(deal);
    setProposalText(content);
    onUpdateDeal({ ...deal, proposalContent: content });
    setIsGenerating(false);
  };

  const handleCreateOdooSO = async () => {
      setIsCreatingSO(true);
      try {
          const odooData = await createSalesOrder(deal, odooCompany.id);
          onUpdateDeal({ ...deal, odooLink: odooData });
      } catch (e) {
          console.error("Failed to create SO", e);
      } finally {
          setIsCreatingSO(false);
      }
  };

  const addResource = (type: Resource['type'], source: Resource['source'], title: string) => {
    const newRes: Resource = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      source,
      title,
      date: new Date().toISOString().split('T')[0],
      url: '#'
    };
    const updatedResources = [...resources, newRes];
    setResources(updatedResources);
    onUpdateDeal({ ...deal, resources: updatedResources });
  };

  const handleApprovalToggle = (role: keyof typeof deal.approvals) => {
      const currentStatus = deal.approvals[role].status;
      const newStatus: ApprovalStatus = currentStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      const updatedApprovals = {
          ...deal.approvals,
          [role]: {
              ...deal.approvals[role],
              status: newStatus,
              timestamp: newStatus === 'APPROVED' ? new Date().toISOString().split('T')[0] : undefined,
              approverId: newStatus === 'APPROVED' ? 'current_user' : undefined
          }
      };
      onUpdateDeal({ ...deal, approvals: updatedApprovals });
  };

  const handleGenerateSummary = async () => {
      setIsSummarizing(true);
      const summary = await generateExecutiveSummary(deal, resources);
      onUpdateDeal({ ...deal, description: summary });
      setIsSummarizing(false);
  };

  const handleGenerateDigest = async () => {
      setIsDigesting(true);
      const digest = await generateWeeklyDigest(deal);
      onUpdateDeal({ 
          ...deal, 
          weeklySummary: digest,
          lastSummaryUpdate: new Date().toISOString().split('T')[0]
      });
      setIsDigesting(false);
  };

  const handlePrimaryContactChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newContactId = e.target.value;
      const contact = contacts.find(c => c.id === newContactId);
      if (contact) {
          onUpdateDeal({
              ...deal,
              contactName: contact.name,
              contactEmail: contact.email,
              // If we were strictly tracking primaryContactId, we'd update it here
          });
          setIsChangingContact(false);
      }
  };

  // Magic Dropzone Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsAnalyzingImage(true);
          
          const reader = new FileReader();
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              // Remove data url prefix
              const base64Content = base64String.split(',')[1];
              
              const analysisStr = await analyzeScreenshot(base64Content);
              try {
                  const json = JSON.parse(analysisStr.replace(/```json/g, '').replace(/```/g, ''));
                  setMagicAnalysis(json);
              } catch (err) {
                  setMagicAnalysis({
                      context: "Manual Review Required",
                      intelligence: analysisStr,
                      suggestedAction: "Check image manually"
                  });
              }
              setIsAnalyzingImage(false);
          };
          reader.readAsDataURL(file);
      }
  };

  const renderDealPulse = () => {
    const isHealthy = deal.health === 'HEALTHY';
    const isAtRisk = deal.health === 'AT_RISK';
    const isCritical = deal.health === 'CRITICAL';

    const bgColor = isHealthy ? 'bg-emerald-50 border-emerald-100' : isAtRisk ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100';
    const iconColor = isHealthy ? 'text-emerald-500' : isAtRisk ? 'text-amber-500' : 'text-rose-500';
    const textColor = isHealthy ? 'text-emerald-900' : isAtRisk ? 'text-amber-900' : 'text-rose-900';
    const barColor = isHealthy ? 'bg-emerald-500' : isAtRisk ? 'bg-amber-500' : 'bg-rose-500';

    return (
      <div className={`mx-6 mt-4 mb-2 p-3 rounded-xl border ${bgColor} flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
        <div className="flex items-center gap-6">
          {/* Health Indicator */}
          <div className="flex items-center gap-3 border-r border-slate-200/50 pr-6">
             <div className="relative">
                <div className={`w-3 h-3 rounded-full ${barColor} animate-pulse`}></div>
                <div className={`absolute -inset-1 rounded-full ${barColor} opacity-20`}></div>
             </div>
             <div>
                <div className={`text-xs font-bold uppercase tracking-wider ${iconColor}`}>
                  {isHealthy ? 'Healthy Pulse' : isAtRisk ? 'At Risk' : 'Critical'}
                </div>
                <div className={`text-xs font-medium ${textColor} opacity-80`}>
                  {deal.daysDormant === 0 ? 'Active today' : `${deal.daysDormant} days dormant`}
                </div>
             </div>
          </div>

          {/* AI Recommendation */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-sm">🤖</div>
             <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Recommended Next Step</div>
                <div className={`text-sm font-medium ${textColor}`}>
                   {deal.aiNextStep}
                </div>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-transform active:scale-95 text-white ${barColor} hover:opacity-90`}>
          Do it now
        </button>
      </div>
    );
  };

  const renderDiscoveryHub = () => (
      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
          {/* Left Panel: El Ingenio de Rucio & Presales Assistant */}
          <div className="col-span-4 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2">
              
              {/* Magic Dropzone Result */}
              {magicAnalysis && (
                  <div className="bg-purple-50 p-5 rounded-xl shadow-sm border border-purple-200 animate-in zoom-in-95">
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📸</span>
                            <h3 className="font-bold text-purple-900">Screenshot Decanter</h3>
                          </div>
                          <button onClick={() => setMagicAnalysis(null)} className="text-purple-400 hover:text-purple-600">✕</button>
                      </div>
                      <div className="space-y-2 text-sm">
                          <div className="bg-white/60 p-2 rounded">
                              <span className="text-xs font-bold text-purple-800 uppercase">Context:</span> <span className="text-purple-900">{magicAnalysis.context}</span>
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                              <span className="text-xs font-bold text-purple-800 uppercase">Intel:</span> <span className="text-purple-900">{magicAnalysis.intelligence}</span>
                          </div>
                          <div className="bg-green-100 p-2 rounded border border-green-200">
                              <span className="text-xs font-bold text-green-800 uppercase">Action:</span> <span className="text-green-900">{magicAnalysis.suggestedAction}</span>
                          </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                          <button className="flex-1 bg-purple-600 text-white py-1.5 rounded text-xs font-bold hover:bg-purple-700">Add to Deal Context</button>
                      </div>
                  </div>
              )}

              {/* Top: El Ingenio de Rucio (Insights) */}
              <div className="bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] p-5 rounded-xl shadow-sm border border-indigo-100">
                  <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm">✨</div>
                      <h3 className="font-bold text-indigo-900">El Ingenio de Rucio</h3>
                  </div>
                  <div className="space-y-3">
                      <div className="bg-white p-3 rounded-xl text-sm text-slate-700 shadow-sm border border-indigo-50/50">
                          <p className="font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wide">Needs Analysis</p>
                          Based on recent emails, the client is prioritizing security over cost. They mentioned "GDPR compliance" 3 times.
                      </div>
                      <div className="bg-white p-3 rounded-xl text-sm text-slate-700 shadow-sm border border-indigo-50/50">
                          <p className="font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wide">Action Item</p>
                          Schedule a technical deep-dive with their CISO before Friday.
                      </div>
                  </div>
              </div>

              {/* Bottom: Presales Assistant (Success Cases) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🔍</span>
                      <h3 className="font-bold text-slate-800">Presales Assistant</h3>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-800 leading-relaxed">
                          I've found similar success cases that match {deal.company}'s requirements.
                      </p>
                  </div>

                  <div className="space-y-4">
                       {/* Success Case 1 */}
                       <div className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors group bg-white shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                               <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center text-red-600 shrink-0">
                                        <span className="font-bold text-[8px]">PDF</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-slate-800 text-xs truncate group-hover:text-blue-600 transition-colors">Global Logistics Cloud Migration</h4>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">95% Match</span>
                                        </div>
                                    </div>
                               </div>
                           </div>
                           <p className="text-[11px] text-slate-600 mb-2 bg-slate-50 p-2 rounded border border-slate-100 leading-snug">
                               <span className="font-bold text-slate-700">Why:</span> Similar legacy migration with compliance needs.
                           </p>
                           <button className="w-full text-xs border border-slate-200 text-slate-600 py-1.5 rounded hover:bg-slate-50 font-medium">Preview Case Study</button>
                       </div>
                  </div>
              </div>
          </div>

          {/* Right Panel: Smart Feed or Linked Assets */}
          <div className="col-span-8 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                  <div className="flex bg-slate-200/50 p-1 rounded-lg">
                      <button 
                        onClick={() => setDiscoveryMode('ACTIVITY')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${discoveryMode === 'ACTIVITY' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        📡 Smart Context Feed
                      </button>
                      <button 
                        onClick={() => setDiscoveryMode('ASSETS')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${discoveryMode === 'ASSETS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        📂 Linked Assets
                      </button>
                  </div>
                  <div className="flex gap-2">
                      {discoveryMode === 'ACTIVITY' && (
                          <button className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-100 font-medium transition-colors border border-blue-100">
                            Sync Now
                          </button>
                      )}
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white">
                   {discoveryMode === 'ACTIVITY' ? (
                       <div className="flex flex-col h-full">
                           {/* MAGIC DROPZONE */}
                           <div className="p-4 mx-6 mt-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl hover:bg-indigo-50 hover:border-indigo-400 transition-all group relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={isAnalyzingImage}
                                />
                                <div className="flex flex-col items-center justify-center py-4 text-center">
                                    {isAnalyzingImage ? (
                                        <>
                                            <div className="animate-spin text-2xl mb-2">⏳</div>
                                            <p className="text-sm font-bold text-indigo-700">Decanting your screenshot...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-3xl mb-2 opacity-50 group-hover:scale-110 transition-transform">📲</div>
                                            <p className="text-sm font-bold text-indigo-900">Magic Dropzone</p>
                                            <p className="text-xs text-indigo-600/80 mt-1 max-w-md">
                                                Drag & Drop screenshots of WhatsApp chats, LinkedIn DMs, or slides.
                                                <br/>Rucio will OCR, analyze sentiment, and update the deal.
                                            </p>
                                        </>
                                    )}
                                </div>
                           </div>
                           
                           {/* TIMELINE HISTORY (Bottom Section) */}
                           <div className="p-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    📜 Context History
                                </h4>
                                <div className="space-y-0">
                                    {/* Feed Item 1: Meet */}
                                    <div className="relative pl-8 pb-8 border-l-2 border-slate-200 last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-100 border-2 border-white ring-1 ring-red-500 flex items-center justify-center box-content">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 block">GOOGLE MEET • RECORDING AVAILABLE</span>
                                                <h4 className="font-bold text-slate-800 text-base">Discovery Call with {deal.company} Team</h4>
                                                <p className="text-xs text-slate-400 mt-1 font-medium">Yesterday, 2:00 PM • 45 min</p>
                                            </div>
                                            <button 
                                            onClick={() => addResource('RECORDING', 'GMEET', `Discovery Call - ${deal.company}`)}
                                            className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-600 font-medium flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                            >
                                                <span>+</span> Link to Deal
                                            </button>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg text-sm text-slate-600 border border-slate-200 shadow-sm">
                                            <p className="font-bold text-slate-700 mb-1 text-xs uppercase">Transcript Summary:</p>
                                            Client expressed interest in Q3 timeline. Main blocker is current vendor contract ending in August. Key stakeholders present: John (CTO), Sarah (VP).
                                        </div>
                                    </div>

                                    {/* Feed Item 2: Gmail */}
                                    <div className="relative pl-8 pb-8 border-l-2 border-slate-200 last:border-0 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white ring-1 ring-blue-500 flex items-center justify-center box-content">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">GMAIL • THREAD</span>
                                                <h4 className="font-bold text-slate-800 text-base">Re: Implementation Questions</h4>
                                                <p className="text-xs text-slate-400 mt-1 font-medium">Oct 22, 10:15 AM</p>
                                            </div>
                                            <button onClick={() => addResource('EMAIL', 'GMAIL', 'Email: Implementation Questions')} className="text-xs border border-slate-200 bg-white px-3 py-1.5 rounded-md hover:bg-slate-50 text-slate-600 font-medium flex items-center gap-1 shadow-sm transition-all active:scale-95"><span>+</span> Link to Deal</button>
                                        </div>
                                        <div className="text-sm text-slate-600 bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                                            "Hi Team, attached are the security compliance forms we need filled out before proceeding..."
                                        </div>
                                    </div>
                                </div>
                           </div>
                       </div>
                   ) : (
                       <div className="p-6">
                            {/* LINKED ASSETS VIEW */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {resources.map(res => (
                                    <div key={res.id} className="group relative flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors
                                            ${res.source === 'GMAIL' ? 'bg-red-50 text-red-500 group-hover:bg-red-100' : 
                                                res.source === 'GKEEP' ? 'bg-yellow-50 text-yellow-600 group-hover:bg-yellow-100' :
                                                res.source === 'GMEET' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' :
                                                'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                            <span className="font-bold text-xs">{res.type.slice(0,3)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{res.title}</h4>
                                            {res.summary && (
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{res.summary}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                       </div>
                   )}
              </div>
          </div>
      </div>
  );

  const renderLiveAssist = () => (
      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
          {/* Main Meet UI (Simulated) */}
          <div className="col-span-8 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-4 left-4 bg-red-600 px-3 py-1 rounded-full text-white text-xs font-bold animate-pulse z-10">
                  REC • 04:22
              </div>
              
              {/* Fake Video Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 p-4 items-center justify-center">
                   <div className="bg-slate-800 rounded-xl h-full flex items-center justify-center relative border border-slate-700">
                        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-4xl text-white font-bold">JD</div>
                        <div className="absolute bottom-4 left-4 text-white text-sm font-medium">John Doe (Client)</div>
                        {/* Audio Wave */}
                        <div className="absolute bottom-4 right-4 flex gap-1 h-4 items-end">
                            <div className="w-1 bg-green-400 h-2 animate-bounce"></div>
                            <div className="w-1 bg-green-400 h-4 animate-bounce delay-75"></div>
                            <div className="w-1 bg-green-400 h-3 animate-bounce delay-150"></div>
                        </div>
                   </div>
                   <div className="bg-slate-800 rounded-xl h-full flex items-center justify-center relative border border-slate-700">
                        <img src="https://ui-avatars.com/api/?name=Me&background=random" className="w-24 h-24 rounded-full" />
                        <div className="absolute bottom-4 left-4 text-white text-sm font-medium">You</div>
                   </div>
              </div>

              {/* Controls */}
              <div className="h-16 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-4">
                  <button onClick={() => setIsLive(!isLive)} className={`p-3 rounded-full ${isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-colors`}>
                      {isLive ? 'End Call' : 'Start Call'}
                  </button>
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">🎤</div>
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white">📷</div>
              </div>
          </div>

          {/* Rucio Sidecar */}
          <div className="col-span-4 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="text-xl">⚡</span> Rucio Sidecar
                  </h3>
                  <p className="text-xs text-slate-500">Real-time objection handling</p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Transcript Stream */}
                  <div className="space-y-2 mb-6">
                      {transcript.length === 0 && !isLive && (
                          <div className="text-center text-slate-400 py-10 text-sm">
                              Start the call to activate live assistance.
                          </div>
                      )}
                      {transcript.map((line, i) => (
                          <div key={i} className={`text-xs p-2 rounded-lg ${line.startsWith('Rep:') ? 'bg-blue-50 ml-8' : 'bg-slate-50 mr-8'}`}>
                              <span className="font-bold text-slate-700 block mb-0.5">{line.split(':')[0]}</span>
                              <span className="text-slate-600">{line.split(':')[1]}</span>
                          </div>
                      ))}
                      {/* Anchor for auto scroll */}
                      <div style={{ float:"left", clear: "both" }}></div>
                  </div>
              </div>

              {/* BATTLE CARD POPUP AREA */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 min-h-[200px]">
                   {battleCard ? (
                       <div className="bg-white border-l-4 border-purple-500 rounded-r-lg shadow-md p-4 animate-in slide-in-from-bottom-5 duration-500">
                           <div className="flex justify-between items-start mb-2">
                               <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Battle Card Activated</span>
                               <span className="text-xs text-slate-400">Just now</span>
                           </div>
                           <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                               {battleCard}
                           </div>
                           <div className="mt-3 flex gap-2">
                               <button className="flex-1 bg-purple-100 text-purple-700 py-1.5 rounded text-xs font-bold hover:bg-purple-200">Copy to Clipboard</button>
                               <button onClick={() => setBattleCard(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2">Dismiss</button>
                           </div>
                       </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                           <span className="text-3xl mb-2">👂</span>
                           <p className="text-xs">Listening for triggers...</p>
                       </div>
                   )}
              </div>
          </div>
      </div>
  );

  const renderProposalTab = () => (
    <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left: Google Doc (Presentation) */}
        <div className="col-span-8 flex flex-col h-full bg-[#F9FBFD] border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {/* Doc Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 bg-[#4285F4] rounded flex items-center justify-center text-white shadow-sm shrink-0">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-medium text-slate-800 truncate">{deal.title} Proposal</h2>
                        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {deal.company} / Proposals
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button 
                    onClick={handleGenerateProposal}
                    disabled={isGenerating}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-medium transition-all shadow-sm
                        ${isGenerating ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#4285F4] hover:bg-blue-600'}
                    `}
                    >
                    {isGenerating ? 'Drafting...' : '✨ Auto-Draft'}
                    </button>
                </div>
            </div>
            
            {/* Doc Toolbar */}
            <div className="bg-[#edf2fa] border-b border-slate-200 px-4 py-1.5 flex items-center gap-4 overflow-x-auto shrink-0">
                <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
                    <button className="p-1 hover:bg-slate-200 rounded"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 14h18"/></svg></button>
                </div>
                <div className="flex items-center gap-1 text-slate-700 text-sm">
                    <select className="bg-transparent hover:bg-slate-200 rounded px-1 py-0.5 outline-none cursor-pointer"><option>Normal text</option></select>
                    <button className="p-1 hover:bg-slate-200 rounded font-bold w-6 text-center">B</button>
                </div>
            </div>

            {/* Doc View */}
            <div className="flex-1 overflow-y-auto bg-[#F0F2F5] p-8 flex justify-center">
                <div className="bg-white w-[816px] min-h-[1056px] shadow-md border border-slate-200 p-12 text-slate-800 text-sm leading-relaxed scale-90 origin-top">
                    {proposalText ? (
                        <div className="prose prose-sm prose-slate max-w-none font-sans whitespace-pre-wrap">
                            {proposalText}
                        </div>
                    ) : (
                        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
                            <p>Document is empty.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right: Odoo Sales Order Integration */}
        <div className="col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-purple-50/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        Odoo
                    </div>
                    <h3 className="font-bold text-slate-800">Sales Command Center</h3>
                </div>
                <p className="text-xs text-slate-500">Official platform for sales orders & invoicing.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 1. Entity Verification */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Entity Verification</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs text-slate-500">Deal Location</span>
                             <span className="text-sm font-semibold text-slate-800">{deal.country}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
                             <span className="text-xs text-slate-500">Target Entity</span>
                             <span className="text-sm font-bold text-purple-700">{odooCompany.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Verified via Global Tax Rules
                        </p>
                    </div>
                </div>

                {/* 2. Line Items Sync */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Order Lines</h4>
                    <div className="space-y-2">
                        {deal.lineItems.length > 0 ? (
                            deal.lineItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                                    <div className="min-w-0 pr-2">
                                        <p className="font-medium text-slate-700 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-medium text-slate-800">${item.unitPrice.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400">x{item.quantity}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
                                No line items configured.
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700 text-sm">Total Value</span>
                            <span className="font-bold text-slate-900">${deal.value.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Creation Action */}
                <div className="mt-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Execution</h4>
                    
                    {deal.odooLink ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">✓</div>
                            <h5 className="font-bold text-green-800 mb-1">Sales Order Created!</h5>
                            <p className="text-xs text-green-700 mb-3">{deal.odooLink.salesOrderId} • {deal.odooLink.companyName}</p>
                            <a 
                              href={deal.odooLink.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-block w-full py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                            >
                                Open in Odoo
                            </a>
                        </div>
                    ) : (
                        <button 
                            onClick={handleCreateOdooSO}
                            disabled={isCreatingSO || deal.lineItems.length === 0}
                            className={`w-full py-3 rounded-lg text-sm font-bold text-white shadow-md transition-all
                                ${isCreatingSO 
                                    ? 'bg-purple-400 cursor-not-allowed' 
                                    : 'bg-purple-600 hover:bg-purple-700 active:scale-95'}
                            `}
                        >
                            {isCreatingSO ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Syncing with {odooCompany.region}...
                                </span>
                            ) : 'Generate Sales Order'}
                        </button>
                    )}
                    
                    {!deal.odooLink && (
                        <p className="text-[10px] text-center text-slate-400 mt-3">
                            This will create a draft SO in the {odooCompany.name} ledger.
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  const renderBidCouncil = () => {
    // ... (Keep existing Bid Council code - redacted for brevity in this specific patch unless requested to change) ...
    // NOTE: To save space in response, I am assuming this section is unchanged. 
    // In a real file update, I would include the full content.
    // For this exercise, I will assume the previous implementation remains unless the prompt explicitly asked for full file rewrite.
    // However, the instructions say "Full content of file_1". So I will put the Bid Council Code back in.
    
    const cols = ['A', 'B', 'C', 'D', 'E'];
    const revenue = deal.value;
    const licenseCost = Math.round(revenue * 0.35); 
    const totalCost = licenseCost + psCost + opsCost;
    const grossMargin = revenue - totalCost;
    const marginPercent = Math.round((grossMargin / revenue) * 100);
    const isAutoApprovable = marginPercent > 30;

    return (
    <div className="flex flex-col h-full bg-slate-50 space-y-4">
        <div className="grid grid-cols-4 gap-4 shrink-0">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Booked Revenue</p>
                 <p className="text-xl font-bold text-slate-800 mt-1">${revenue.toLocaleString()}</p>
                 <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    <span>✓ Synced with Odoo</span>
                 </div>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Total Est. Cost</p>
                 <p className="text-xl font-bold text-slate-800 mt-1">${totalCost.toLocaleString()}</p>
                 <p className="text-[10px] text-slate-400 mt-1">Includes Ops & PS inputs</p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Gross Margin ($)</p>
                 <p className={`text-xl font-bold mt-1 ${grossMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${grossMargin.toLocaleString()}
                 </p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Margin %</p>
                 <div className="flex items-end gap-2">
                     <p className={`text-xl font-bold mt-1 ${marginPercent > 20 ? 'text-green-600' : 'text-amber-500'}`}>
                        {marginPercent}%
                     </p>
                     <span className="text-[10px] text-slate-400 mb-1">Target: 30%</span>
                 </div>
             </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-9 flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3 shrink-0">
                    <div className="w-9 h-9 bg-[#0F9D58] rounded flex items-center justify-center text-white shadow-sm shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-medium text-slate-800 truncate">Global_Bid_Model_v3.xlsx</h2>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                             Live Update
                        </div>
                    </div>
                </div>

                <div className="bg-[#edf2fa] border-b border-slate-200 shrink-0">
                    <div className="px-4 py-1.5 flex items-center gap-4 border-b border-slate-200 overflow-x-auto">
                        <button className="font-bold p-1 hover:bg-slate-200 rounded w-6 text-center">B</button>
                        <button className="italic p-1 hover:bg-slate-200 rounded w-6 text-center">I</button>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <button className="p-1 hover:bg-slate-200 rounded text-slate-600">$</button>
                        <button className="p-1 hover:bg-slate-200 rounded text-slate-600">%</button>
                    </div>
                    <div className="px-2 py-1 flex items-center gap-2 bg-white">
                        <span className="text-slate-400 font-serif italic px-2">fx</span>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <input type="text" className="w-full text-sm outline-none px-2 text-slate-600" readOnly value={`=SUM(C3:C6)`} />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white relative">
                    <table className="w-full border-collapse min-w-[600px]">
                        <thead>
                            <tr>
                                <th className="w-10 bg-[#f8f9fa] border border-slate-300"></th>
                                {cols.map(c => (
                                    <th key={c} className="bg-[#f8f9fa] border border-slate-300 text-xs font-normal text-slate-600 py-1">{c}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Line Item', 'Source', 'Amount ($)', 'Notes', 'Owner'],
                                ['Total Revenue', 'Odoo SO', revenue, 'Booked value', 'Sales'],
                                ['Cost of Goods (Software)', 'System (35%)', -licenseCost, 'Standard licensing', 'Finance'],
                                ['Prof. Services Cost', 'Input (Sidebar)', -psCost, 'Implementation labor', 'PS Dept'],
                                ['Sales Ops Cost', 'Input (Sidebar)', -opsCost, 'Pre-sales eng', 'Ops'],
                                ['', '', '', '', ''],
                                ['NET PROFIT', 'Calculated', grossMargin, 'EBITDA Contribution', 'Finance'],
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td className="bg-[#f8f9fa] border border-slate-300 text-center text-xs text-slate-500 font-medium">{i + 1}</td>
                                    {row.map((cell, j) => (
                                        <td key={j} className={`border border-slate-200 px-2 py-1 text-sm text-slate-700 
                                            ${i === 0 ? 'font-bold bg-slate-50 text-slate-800' : ''} 
                                            ${i === 6 && j === 2 ? (grossMargin > 0 ? 'font-bold text-green-700 bg-green-50' : 'font-bold text-red-700 bg-red-50') : ''}
                                            ${j === 2 && i > 0 && typeof cell === 'number' ? 'text-right font-mono' : ''}
                                        `}>
                                            {typeof cell === 'number' ? (cell < 0 ? `($${Math.abs(cell).toLocaleString()})` : `$${cell.toLocaleString()}`) : cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                <div className={`p-4 rounded-xl border shadow-sm ${isAutoApprovable ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{isAutoApprovable ? '✅' : '⚖️'}</span>
                        <span className={`text-xs font-bold uppercase ${isAutoApprovable ? 'text-green-800' : 'text-slate-700'}`}>
                            Smart Governance
                        </span>
                    </div>
                    {isAutoApprovable ? (
                        <p className="text-xs text-green-700">
                            Margin > 30% met. <br/>
                            <span className="font-bold">Finance gate auto-approved.</span>
                        </p>
                    ) : (
                        <p className="text-xs text-slate-500">
                            Standard review required. <br/>
                            Margin is below 30% threshold.
                        </p>
                    )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <span className="text-lg">🛡️</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">Approval Gates</span>
                    </div>
                    <div className="space-y-3">
                        {[
                            { key: 'finance', label: 'Finance', role: 'FINANCE' },
                            { key: 'salesOps', label: 'Sales Ops', role: 'SALES_OPS' },
                            { key: 'ps', label: 'Prof. Services', role: 'PS_MANAGER' },
                            { key: 'delivery', label: 'Delivery', role: 'DELIVERY_MANAGER' }
                        ].map((gate) => {
                             let status = deal.approvals[gate.key as keyof typeof deal.approvals]?.status || 'PENDING';
                             if (gate.key === 'finance' && isAutoApprovable && status === 'PENDING') {
                                 status = 'AUTO_APPROVED';
                             }
                             const isApproved = status === 'APPROVED' || status === 'AUTO_APPROVED';
                             return (
                                <div key={gate.key} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{gate.label}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">
                                                {status.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                      onClick={() => handleApprovalToggle(gate.key as any)}
                                      disabled={status === 'AUTO_APPROVED'}
                                      className={`text-[10px] px-2 py-1 rounded border transition-all
                                        ${isApproved 
                                            ? 'bg-green-50 text-green-700 border-green-200 cursor-default' 
                                            : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
                                      `}
                                    >
                                        {isApproved ? '✓' : 'Approve'}
                                    </button>
                                </div>
                             )
                        })}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">⚙️</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">Sales Ops Input</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Est. Operational Cost ($)</label>
                        <input 
                            type="number" 
                            value={opsCost}
                            onChange={(e) => setOpsCost(Number(e.target.value))}
                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">👷</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">Prof. Services Input</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Implementation Labor ($)</label>
                        <input 
                            type="number" 
                            value={psCost}
                            onChange={(e) => setPsCost(Number(e.target.value))}
                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                    </div>
                </div>

            </div>
        </div>
    </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Toolbar */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-6">
          <button 
             onClick={onClose}
             className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium"
          >
             ← Back to Board
          </button>
          <div className="h-4 w-px bg-slate-300"></div>
          <div className="flex gap-1">
             {['DISCOVERY', 'OVERVIEW', 'LIVE_ASSIST', 'PROPOSAL', 'BID_COUNCIL', 'STAKEHOLDERS'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as Tab)}
                 className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                   ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                 `}
               >
                 {tab === 'LIVE_ASSIST' ? '🔴 Live Assist' : tab === 'BID_COUNCIL' ? 'Bid Council' : tab.charAt(0) + tab.slice(1).toLowerCase()}
               </button>
             ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                All changes saved
            </span>
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Share Workspace
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-100 p-4 flex flex-col">
        {activeTab !== 'LIVE_ASSIST' && renderDealPulse()}
        
        <div className="flex-1 overflow-hidden max-w-[1200px] mx-auto w-full">
            
            {activeTab === 'DISCOVERY' && renderDiscoveryHub()}
            {activeTab === 'LIVE_ASSIST' && renderLiveAssist()}

            {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-3 gap-6 h-full overflow-y-auto pb-4 no-scrollbar">
                    <div className="col-span-2 space-y-6">
                        {/* Executive Summary Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Executive Brief</h2>
                                <button 
                                    onClick={handleGenerateSummary}
                                    disabled={isSummarizing}
                                    className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                    {isSummarizing ? 'Summarizing...' : '✨ Auto-Summarize'}
                                </button>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                {deal.description}
                             </div>
                             <p className="text-[10px] text-slate-400 mt-2 text-right">
                                Generated based on {resources.length} discovery assets.
                             </p>
                        </div>

                        {/* MEDDPICC Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Deal Qualification (MEDDPICC)</h2>
                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Enterprise Framework</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Metrics (Value)</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.metrics}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Economic Buyer</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.economicBuyer}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Decision Criteria</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.decisionCriteria}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Decision Process</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.decisionProcess}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Identified Pain</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.identifiedPain}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Champion</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.champion}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Competition</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.competition}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Paper Process</label>
                                    <p className="text-sm font-medium text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">{deal.meddpicc.paperProcess}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 space-y-6">
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-visible">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-slate-700">Primary Contact</h3>
                                <button 
                                    onClick={() => setIsChangingContact(!isChangingContact)}
                                    className="text-xs text-blue-600 font-medium hover:underline"
                                >
                                    {isChangingContact ? 'Cancel' : 'Change'}
                                </button>
                            </div>
                            
                            {isChangingContact ? (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="text-xs text-slate-500 block mb-1">Select from Stakeholders:</label>
                                    <select 
                                        onChange={handlePrimaryContactChange}
                                        className="w-full text-sm border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose a contact...</option>
                                        {contacts.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                        ))}
                                    </select>
                                    <div className="mt-2 text-center">
                                         <button onClick={onOpenContacts} className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center justify-center gap-1 mx-auto">
                                            <span>+</span> Add new contact in App
                                         </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {deal.contactName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{deal.contactName}</p>
                                        <p className="text-sm text-slate-500">{deal.contactEmail}</p>
                                    </div>
                                </div>
                            )}
                         </div>
                         
                         {/* Location Card */}
                         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-700 mb-2">Location</h3>
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <span>🌍</span>
                                {deal.country}
                            </div>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'PROPOSAL' && renderProposalTab()}

            {activeTab === 'BID_COUNCIL' && renderBidCouncil()}

            {activeTab === 'STAKEHOLDERS' && (
                 <div className="h-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800">Stakeholders & Contacts</h2>
                        <button 
                          onClick={onOpenContacts}
                          className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                            <span>👥</span> Manage in Contacts App
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contacts.filter(c => deal.contactIds.includes(c.id)).map(contact => (
                             <div key={contact.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="flex items-start gap-4 mb-4 mt-2">
                                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div className="min-w-0 pt-1">
                                        <h3 className="font-bold text-slate-800 truncate">{contact.name}</h3>
                                        <p className="text-sm text-slate-500">{contact.role}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-blue-600">{contact.company}</p>
                                    <div className="text-xs text-slate-500 flex items-center gap-2">
                                        <span>📧</span> <span className="truncate">{contact.email}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {contact.tags.map(tag => (
                                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
