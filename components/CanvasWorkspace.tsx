
import React, { useState, useEffect, useRef } from 'react';
import { Deal, Resource, Contact, LineItem, OdooLink, ApprovalStatus, BuyingRole, ExchangeRates } from '../types';
import { generateProposalDraft, generateExecutiveSummary, generateWeeklyDigest, analyzeScreenshot, getBattleCard } from '../services/geminiService';
import { getOdooCompanyForDeal, createSalesOrder } from '../services/odooService';
import { formatCurrency, formatNumber } from '../utils/formatting';

interface CanvasWorkspaceProps {
  deal: Deal;
  contacts: Contact[];
  exchangeRates: ExchangeRates; // Passed from App state
  onClose: () => void;
  onUpdateDeal: (deal: Deal) => void;
  onOpenContacts: () => void;
}

type Tab = 'DISCOVERY' | 'OVERVIEW' | 'LIVE_ASSIST' | 'PROPOSAL' | 'BID_COUNCIL' | 'STAKEHOLDERS';
type DiscoveryMode = 'ACTIVITY' | 'ASSETS';

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({ deal, contacts, exchangeRates, onClose, onUpdateDeal, onOpenContacts }) => {
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

  // Odoo & Finance State
  const [isCreatingSO, setIsCreatingSO] = useState(false);
  const [odooCompany, setOdooCompany] = useState(getOdooCompanyForDeal(deal.country));
  
  // Bid Council State
  const [psCost, setPsCost] = useState(Math.round(deal.value * 0.15));
  const [opsCost, setOpsCost] = useState(Math.round(deal.value * 0.05));
  
  // Calculate Exchange Rate logic
  const targetCurrency = odooCompany.currency;
  // Use deal override if exists, otherwise global rate, default to 1 for USD
  const currentExchangeRate = deal.exchangeRateOverride || exchangeRates[targetCurrency] || 1;
  const localValue = deal.value * currentExchangeRate;

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
            { speaker: 'Cliente', text: "Gracias por unirse. Para ser honesto, también estamos considerando AWS." },
            { speaker: 'Rep', text: "Entendido. AWS es un competidor fuerte." },
            { speaker: 'Cliente', text: "Sí, sus precios parecen un poco más flexibles para nuestro volumen." },
            { speaker: 'Cliente', text: "Y nos preocupa el cronograma de migración." },
            { speaker: 'Rep', text: "¿Puede contarme más sobre las restricciones de tiempo?" },
            { speaker: 'Cliente', text: "Necesitamos estar en vivo para el Q1 o perdemos el presupuesto." }
        ];
        let index = 0;
        interval = setInterval(async () => {
            if (index < simulatedConversation.length) {
                const line = simulatedConversation[index];
                setTranscript(prev => [...prev, `${line.speaker}: ${line.text}`]);
                
                // Trigger Battle Cards
                if (line.text.includes("AWS") || line.text.includes("precios")) {
                     const card = await getBattleCard("Competidor: AWS + Objeción de Precio", deal.description);
                     setBattleCard(card);
                } else if (line.text.includes("cronograma") || line.text.includes("Q1")) {
                     const card = await getBattleCard("Objeción: Presión de Tiempo", deal.description);
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
          const odooData = await createSalesOrder(deal, odooCompany.id, targetCurrency, localValue);
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

  const handleRateOverride = (value: string) => {
      onUpdateDeal({ ...deal, exchangeRateOverride: parseFloat(value) });
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
                      context: "Revisión Manual Requerida",
                      intelligence: analysisStr,
                      suggestedAction: "Revisar imagen manualmente"
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
                  {isHealthy ? 'Pulso Saludable' : isAtRisk ? 'En Riesgo' : 'Crítico'}
                </div>
                <div className={`text-xs font-medium ${textColor} opacity-80`}>
                  {deal.daysDormant === 0 ? 'Activo hoy' : `${deal.daysDormant} días inactivo`}
                </div>
             </div>
          </div>

          {/* AI Recommendation */}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-sm">🤖</div>
             <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Siguiente Paso Recomendado</div>
                <div className={`text-sm font-medium ${textColor}`}>
                   {deal.aiNextStep}
                </div>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm transition-transform active:scale-95 text-white ${barColor} hover:opacity-90`}>
          Hacerlo ahora
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
                            <h3 className="font-bold text-purple-900">Decantador de Capturas</h3>
                          </div>
                          <button onClick={() => setMagicAnalysis(null)} className="text-purple-400 hover:text-purple-600">✕</button>
                      </div>
                      <div className="space-y-2 text-sm">
                          <div className="bg-white/60 p-2 rounded">
                              <span className="text-xs font-bold text-purple-800 uppercase">Contexto:</span> <span className="text-purple-900">{magicAnalysis.context}</span>
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                              <span className="text-xs font-bold text-purple-800 uppercase">Intel:</span> <span className="text-purple-900">{magicAnalysis.intelligence}</span>
                          </div>
                          <div className="bg-green-100 p-2 rounded border border-green-200">
                              <span className="text-xs font-bold text-green-800 uppercase">Acción:</span> <span className="text-green-900">{magicAnalysis.suggestedAction}</span>
                          </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                          <button className="flex-1 bg-purple-600 text-white py-1.5 rounded text-xs font-bold hover:bg-purple-700">Agregar al Contexto</button>
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
                          <p className="font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wide">Análisis de Necesidades</p>
                          Basado en emails recientes, el cliente prioriza la seguridad sobre el costo. Mencionaron "Cumplimiento GDPR" 3 veces.
                      </div>
                      <div className="bg-white p-3 rounded-xl text-sm text-slate-700 shadow-sm border border-indigo-50/50">
                          <p className="font-bold text-indigo-700 mb-1 text-xs uppercase tracking-wide">Acción Recomendada</p>
                          Programar una sesión técnica profunda con su CISO antes del viernes.
                      </div>
                  </div>
              </div>

              {/* Bottom: Presales Assistant (Success Cases) */}
              <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">🔍</span>
                      <h3 className="font-bold text-slate-800">Asistente de Preventa</h3>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                      <p className="text-xs text-blue-800 leading-relaxed">
                          Encontré casos de éxito similares que coinciden con los requisitos de {deal.company}.
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
                               <span className="font-bold text-slate-700">Por qué:</span> Migración legacy similar con necesidades de cumplimiento.
                           </p>
                           <button className="w-full text-xs border border-slate-200 text-slate-600 py-1.5 rounded hover:bg-slate-50 font-medium">Previsualizar Caso</button>
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
                        📡 Feed Inteligente
                      </button>
                      <button 
                        onClick={() => setDiscoveryMode('ASSETS')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${discoveryMode === 'ASSETS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        📂 Archivos Vinculados
                      </button>
                  </div>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-white">
                   {/* ... Keep Feed Content ... */}
                   {discoveryMode === 'ACTIVITY' ? (
                       <div className="p-6">
                           <div className="text-center text-slate-400">Feed de Actividad (Simulado)</div>
                       </div>
                   ) : (
                       <div className="p-6">
                           <div className="text-center text-slate-400">Archivos (Simulado)</div>
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
                        <h2 className="text-base font-medium text-slate-800 truncate">Propuesta: {deal.title}</h2>
                        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                            {deal.company} / Propuestas
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
                    {isGenerating ? 'Redactando...' : '✨ Auto-Redactar'}
                    </button>
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
                            <p>El documento está vacío.</p>
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
                    <h3 className="font-bold text-slate-800">Centro de Ventas</h3>
                </div>
                <p className="text-xs text-slate-500">Plataforma oficial para órdenes y facturación.</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* 1. Entity Verification */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Verificación de Entidad</h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs text-slate-500">Ubicación Deal</span>
                             <span className="text-sm font-semibold text-slate-800">{deal.country}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2">
                             <span className="text-xs text-slate-500">Entidad Destino</span>
                             <span className="text-sm font-bold text-purple-700">{odooCompany.name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 mb-2">
                             <span className="text-xs text-slate-500">Moneda Local</span>
                             <div className="text-right">
                                <span className="text-sm font-bold text-slate-800 block">{targetCurrency}</span>
                                <span className="text-[10px] text-slate-400">1 USD = {formatNumber(currentExchangeRate)} {targetCurrency}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* 2. Line Items Sync */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Líneas de Orden</h4>
                    <div className="space-y-2">
                        {deal.lineItems.length > 0 ? (
                            deal.lineItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0">
                                    <div className="min-w-0 pr-2">
                                        <p className="font-medium text-slate-700 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-medium text-slate-800">{formatCurrency(item.unitPrice)}</p>
                                        <p className="text-[10px] text-slate-400">x{item.quantity}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-4 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
                                No hay ítems configurados.
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700 text-sm">Valor Total (USD)</span>
                            <span className="font-bold text-slate-900">{formatCurrency(deal.value)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 bg-purple-50 p-2 rounded">
                            <span className="font-bold text-purple-700 text-sm">Valor Odoo ({targetCurrency})</span>
                            <span className="font-bold text-purple-900">{formatCurrency(localValue, targetCurrency)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Creation Action */}
                <div className="mt-auto">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">3. Ejecución</h4>
                    
                    {deal.odooLink ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">✓</div>
                            <h5 className="font-bold text-green-800 mb-1">¡Orden de Venta Creada!</h5>
                            <p className="text-xs text-green-700 mb-3">{deal.odooLink.salesOrderId} • {deal.odooLink.companyName}</p>
                             <div className="text-xs text-green-800 mb-3">
                                Total: {formatCurrency(deal.odooLink.totalLocalCurrency, deal.odooLink.currency)}
                            </div>
                            <a 
                              href={deal.odooLink.url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-block w-full py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                            >
                                Abrir en Odoo
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
                                    Sincronizando con {odooCompany.region}...
                                </span>
                            ) : 'Generar Orden de Venta'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  const renderBidCouncil = () => {
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
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Revenue (USD)</p>
                 <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(revenue)}</p>
                 <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full w-fit">
                    <span>✓ Sincronizado con Odoo</span>
                 </div>
             </div>
             
             {/* Exchange Rate Card */}
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Tasa de Cambio ({targetCurrency})</p>
                 <div className="flex items-center gap-2 mt-1">
                     <input 
                       type="number"
                       value={currentExchangeRate}
                       onChange={(e) => handleRateOverride(e.target.value)}
                       className="w-20 text-xl font-bold text-slate-800 border-b border-slate-200 outline-none focus:border-blue-500"
                     />
                     <span className="text-xs text-slate-400">/ USD</span>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1">
                     {deal.exchangeRateOverride ? 'Personalizada para este deal' : 'Usando tasa trimestral'}
                 </p>
             </div>

             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Margen Bruto ($)</p>
                 <p className={`text-xl font-bold mt-1 ${grossMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(grossMargin)}
                 </p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <p className="text-xs text-slate-500 font-bold uppercase">Margen %</p>
                 <div className="flex items-end gap-2">
                     <p className={`text-xl font-bold mt-1 ${marginPercent > 20 ? 'text-green-600' : 'text-amber-500'}`}>
                        {marginPercent}%
                     </p>
                     <span className="text-[10px] text-slate-400 mb-1">Objetivo: 30%</span>
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
                        <h2 className="text-base font-medium text-slate-800 truncate">Modelo_Oferta_Global_v3.xlsx</h2>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                             En Vivo
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="flex-1 overflow-auto bg-white relative p-4">
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
                                ['Ítem', 'Fuente', 'Monto ($ USD)', 'Notas', 'Dueño'],
                                ['Total Revenue', 'Odoo SO', revenue, 'Valor en libros', 'Ventas'],
                                ['Costo Software', 'Sistema (35%)', -licenseCost, 'Licenciamiento std', 'Finanzas'],
                                ['Costo Serv. Prof.', 'Input (Manual)', -psCost, 'Labor implementación', 'Depto PS'],
                                ['Costo Sales Ops', 'Input (Manual)', -opsCost, 'Ingeniería preventa', 'Ops'],
                                ['', '', '', '', ''],
                                ['UTILIDAD NETA', 'Calculado', grossMargin, 'Contribución EBITDA', 'Finanzas'],
                            ].map((row, i) => (
                                <tr key={i}>
                                    <td className="bg-[#f8f9fa] border border-slate-300 text-center text-xs text-slate-500 font-medium">{i + 1}</td>
                                    {row.map((cell, j) => (
                                        <td key={j} className={`border border-slate-200 px-2 py-1 text-sm text-slate-700 
                                            ${i === 0 ? 'font-bold bg-slate-50 text-slate-800' : ''} 
                                            ${i === 6 && j === 2 ? (grossMargin > 0 ? 'font-bold text-green-700 bg-green-50' : 'font-bold text-red-700 bg-red-50') : ''}
                                            ${j === 2 && i > 0 && typeof cell === 'number' ? 'text-right font-mono' : ''}
                                        `}>
                                            {typeof cell === 'number' ? 
                                              (cell < 0 ? `(${formatCurrency(Math.abs(cell))})` : formatCurrency(cell)) 
                                              : cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                {/* Keep approval blocks */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">⚙️</span>
                        <span className="text-xs font-bold text-slate-700 uppercase">Input Sales Ops</span>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 block mb-1">Costo Operativo Est. ($)</label>
                        <input 
                            type="number" 
                            value={opsCost}
                            onChange={(e) => setOpsCost(Number(e.target.value))}
                            className="w-full text-sm border border-slate-200 rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                        />
                    </div>
                </div>
                {/* ... other blocks ... */}
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
             ← Volver al Tablero
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
                 {tab === 'LIVE_ASSIST' ? '🔴 Asistente en Vivo' : 
                  tab === 'BID_COUNCIL' ? 'Comité de Oferta' : 
                  tab === 'DISCOVERY' ? 'Descubrimiento' :
                  tab === 'OVERVIEW' ? 'Resumen' :
                  tab === 'PROPOSAL' ? 'Propuesta' :
                  tab === 'STAKEHOLDERS' ? 'Interesados' : tab}
               </button>
             ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Cambios guardados
            </span>
            <button className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Compartir
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-100 p-4 flex flex-col">
        {activeTab !== 'LIVE_ASSIST' && renderDealPulse()}
        
        <div className="flex-1 overflow-hidden max-w-[1200px] mx-auto w-full">
            
            {activeTab === 'DISCOVERY' && renderDiscoveryHub()}
            {activeTab === 'LIVE_ASSIST' && (
              <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
                <div className="col-span-8 bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-white">
                  (Simulación de Video Llamada)
                </div>
                <div className="col-span-4 bg-white p-4 rounded-xl">
                  (Simulación de Asistente)
                </div>
              </div>
            )}

            {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-3 gap-6 h-full overflow-y-auto pb-4 no-scrollbar">
                    {/* ... Overview content ... */}
                    <div className="col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                             <div className="flex justify-between items-start mb-4">
                                <h2 className="text-lg font-bold text-slate-800">Resumen Ejecutivo</h2>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                {deal.description}
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'PROPOSAL' && renderProposalTab()}

            {activeTab === 'BID_COUNCIL' && renderBidCouncil()}

            {activeTab === 'STAKEHOLDERS' && (
                 <div className="h-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Interesados</h2>
                    {/* ... Stakeholders content ... */}
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};
