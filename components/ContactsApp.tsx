

import React, { useState, useMemo } from 'react';
import { Contact, Deal, BuyingRole } from '../types';

interface ContactsAppProps {
  contacts: Contact[];
  deals: Deal[];
  onUpdateContact: (contact: Contact) => void;
  initialFilterDealId?: string | null;
}

interface EnrichmentSuggestion {
    id: string;
    field: keyof Contact;
    value: string;
    displayValue: string;
    source: string;
}

const BUYING_ROLES: { value: BuyingRole; label: string; icon: string }[] = [
    { value: 'CHAMPION', label: 'Champion', icon: '🏆' },
    { value: 'ECONOMIC_BUYER', label: 'Comprador Econ.', icon: '💰' },
    { value: 'TECHNICAL_EVALUATOR', label: 'Eval. Técnico', icon: '⚙️' },
    { value: 'BLOCKER', label: 'Bloqueador', icon: '🛑' },
    { value: 'COACH', label: 'Coach', icon: '📣' },
    { value: 'USER', label: 'Usuario Final', icon: '👤' },
    { value: 'UNKNOWN', label: 'Desconocido', icon: '❓' },
];

export const ContactsApp: React.FC<ContactsAppProps> = ({ 
  contacts, 
  deals, 
  onUpdateContact,
  initialFilterDealId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedDealId, setSelectedDealId] = useState<string>(initialFilterDealId || 'All');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Enrichment State
  const [enrichmentSuggestions, setEnrichmentSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

  // Extract unique companies for filter
  const companies = useMemo(() => 
    ['All', ...Array.from(new Set(contacts.map(c => c.company)))], 
  [contacts]);

  // Filter Logic
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            contact.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = selectedCompany === 'All' || contact.company === selectedCompany;
      
      let matchesDeal = true;
      if (selectedDealId !== 'All') {
         const deal = deals.find(d => d.id === selectedDealId);
         if (deal) {
            matchesDeal = deal.contactIds.includes(contact.id);
         } else {
             matchesDeal = false;
         }
      }

      return matchesSearch && matchesCompany && matchesDeal;
    });
  }, [contacts, searchTerm, selectedCompany, selectedDealId, deals]);

  const handleScan = () => {
    setIsScanning(true);
    setScanResult(null);
    // Simulate AI delay
    setTimeout(() => {
        setIsScanning(false);
        setScanResult("Se encontraron 2 contactos nuevos en emails recientes con Acme Corp. Se enriquecieron 3 perfiles.");
    }, 2000);
  };

  const triggerEnrichment = (contact: Contact) => {
      setIsEnriching(true);
      setEnrichmentSuggestions([]);

      // Simulate AI analysis of email signatures and public web
      setTimeout(() => {
          const suggestions: EnrichmentSuggestion[] = [];
          
          // 1. Phone from Email Signature
          if (!contact.phone || contact.phone.length < 10) {
              suggestions.push({
                  id: 'phone_sig',
                  field: 'phone',
                  value: '+1 (415) 555-0199',
                  displayValue: '+1 (415) 555-0199',
                  source: 'Firma de Email (Recibido Oct 24)'
              });
          }

          // 2. LinkedIn from Name/Company
          if (!contact.linkedin) {
              suggestions.push({
                  id: 'linkedin_web',
                  field: 'linkedin',
                  value: `linkedin.com/in/${contact.name.toLowerCase().replace(/\s+/g, '')}`,
                  displayValue: `linkedin.com/in/${contact.name.toLowerCase().replace(/\s+/g, '')}`,
                  source: 'Coincidencia LinkedIn'
              });
          }

          // 3. Location from IP/Timezone or LinkedIn
          if (!contact.location) {
               suggestions.push({
                  id: 'location_web',
                  field: 'location',
                  value: 'San Francisco, Bay Area',
                  displayValue: 'San Francisco, Bay Area',
                  source: 'Clearbit Enrichment'
              });
          }
          
          // 4. Job Title Update (Signature mismatch)
          if (contact.role && !contact.role.toLowerCase().includes('senior') && Math.random() > 0.5) {
               suggestions.push({
                  id: 'role_sig',
                  field: 'role',
                  value: 'Senior ' + contact.role,
                  displayValue: 'Senior ' + contact.role,
                  source: 'Firma Email vs Actual'
              });
          }

          if (suggestions.length === 0) {
              // Fallback if data is already perfect
             setScanResult("El perfil está actualizado según los datos disponibles.");
          }

          setEnrichmentSuggestions(suggestions);
          setIsEnriching(false);
      }, 1500);
  };

  const acceptSuggestion = (suggestion: EnrichmentSuggestion) => {
      if (editingContact) {
          setEditingContact({
              ...editingContact,
              [suggestion.field]: suggestion.value,
              aiEnriched: true // Mark as enriched if we accept data
          });
          // Remove accepted suggestion
          setEnrichmentSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
      }
  };

  const rejectSuggestion = (id: string) => {
      setEnrichmentSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleRoleChange = (role: BuyingRole) => {
      if (editingContact) {
          setEditingContact({ ...editingContact, buyingRole: role });
      }
  };

  const handleInputChange = (field: keyof Contact, value: string) => {
      if (editingContact) {
          setEditingContact({ ...editingContact, [field]: value });
      }
  };

  const handleEditClick = (contact: Contact) => {
      setEditingContact(contact);
      setEnrichmentSuggestions([]); // Reset suggestions when opening new contact
  };

  return (
    <div className="flex h-full bg-slate-50 relative">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Toolbar */}
        <div className="bg-white border-b border-slate-200 p-6 shadow-sm z-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Contactos</h1>
                    <p className="text-slate-500 text-sm">Gestiona relaciones en todas las oportunidades.</p>
                </div>
                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-70"
                >
                    {isScanning ? (
                        <>
                         <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Escaneando Gmail y LinkedIn...
                        </>
                    ) : (
                        <>
                         <span>✨</span>
                         Escanear Nuevos Contactos
                        </>
                    )}
                </button>
           </div>

           {scanResult && (
               <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center gap-2">
                       <span className="text-xl">🤖</span>
                       <span className="text-sm font-medium">{scanResult}</span>
                   </div>
                   <button onClick={() => setScanResult(null)} className="text-green-600 hover:text-green-800">✕</button>
               </div>
           )}

           <div className="flex flex-wrap items-center gap-3">
               <div className="relative flex-1 min-w-[240px]">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                   <input 
                     type="text" 
                     placeholder="Buscar por nombre, email o empresa..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-lg text-sm outline-none transition-all"
                   />
               </div>
               
               <select 
                 value={selectedCompany}
                 onChange={(e) => setSelectedCompany(e.target.value)}
                 className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-blue-500 outline-none cursor-pointer"
               >
                   <option value="All">Todas las Empresas</option>
                   {companies.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
               </select>

               <select
                 value={selectedDealId}
                 onChange={(e) => setSelectedDealId(e.target.value)}
                 className={`px-3 py-2 border rounded-lg text-sm outline-none cursor-pointer transition-colors
                    ${selectedDealId !== 'All' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}
                 `}
               >
                   <option value="All">Filtrar por Oportunidad</option>
                   {deals.map(d => (
                       <option key={d.id} value={d.id}>{d.title} ({d.company})</option>
                   ))}
               </select>
           </div>
        </div>

        {/* Contacts Grid */}
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContacts.map(contact => (
                    <div 
                      key={contact.id} 
                      onClick={() => handleEditClick(contact)}
                      className="group bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
                    >
                        <div className="p-5 flex items-start gap-4">
                            <div className="relative shrink-0">
                                <img src={contact.avatar} alt={contact.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <img src={`https://ui-avatars.com/api/?name=${contact.company}&background=random&size=16`} className="w-4 h-4 rounded-full" />
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 truncate">{contact.name}</h3>
                                    {contact.aiEnriched && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold" title="Enriquecido por Rucio AI">AI ✨</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 truncate">{contact.role}</p>
                                <p className="text-xs font-semibold text-blue-600 mt-0.5">{contact.company}</p>
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-slate-50 border-y border-slate-100 space-y-2">
                             <div className="flex items-center gap-2 text-xs text-slate-600">
                                 <span className="text-slate-400">📧</span>
                                 <span className="truncate">{contact.email}</span>
                             </div>
                             {contact.phone && (
                                <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="text-slate-400">📞</span>
                                    <span>{contact.phone}</span>
                                </div>
                             )}
                        </div>

                        <div className="px-5 py-3 mt-auto flex items-center justify-between bg-white">
                             <div className="flex gap-1 overflow-hidden">
                                {contact.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200 whitespace-nowrap">
                                        {tag}
                                    </span>
                                ))}
                                {contact.tags.length > 2 && <span className="text-[10px] text-slate-400 px-1">+{contact.tags.length - 2}</span>}
                             </div>
                             <button className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                Editar →
                             </button>
                        </div>
                    </div>
                ))}
            </div>
            {filteredContacts.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <span className="text-4xl mb-4">👻</span>
                    <p>No se encontraron contactos con estos filtros.</p>
                </div>
            )}
        </div>
      </div>

      {/* Edit/Details Sidebar (Drawer) */}
      {editingContact && (
          <div className="w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-20 animate-in slide-in-from-right duration-300">
               <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                   <div className="flex items-center gap-4">
                       <img src={editingContact.avatar} className="w-12 h-12 rounded-full border border-slate-100" />
                       <div>
                           <h2 className="font-bold text-slate-800">{editingContact.name}</h2>
                           <p className="text-sm text-slate-500">{editingContact.role}</p>
                       </div>
                   </div>
                   <button onClick={() => setEditingContact(null)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   
                   {/* Buying Role Selection */}
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Rol de Compra (Influencia)</label>
                       <div className="grid grid-cols-2 gap-2">
                           {BUYING_ROLES.map(role => (
                               <button 
                                 key={role.value}
                                 onClick={() => handleRoleChange(role.value)}
                                 className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all text-left
                                    ${editingContact.buyingRole === role.value 
                                        ? 'bg-blue-50 border-blue-300 text-blue-800 ring-1 ring-blue-300' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200'}
                                 `}
                               >
                                   <span className="text-base">{role.icon}</span>
                                   <span>{role.label}</span>
                               </button>
                           ))}
                       </div>
                   </div>

                   {/* AI Enrichment Section */}
                   <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                       <div className="flex items-center gap-2 mb-2">
                           <span className="text-lg">✨</span>
                           <h3 className="text-sm font-bold text-purple-800">Inteligencia Rucio</h3>
                       </div>

                       {isEnriching ? (
                           <div className="flex flex-col items-center justify-center py-6 text-purple-600">
                               <svg className="animate-spin h-6 w-6 mb-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                               <p className="text-xs font-medium">Escaneando datos públicos y firmas...</p>
                           </div>
                       ) : enrichmentSuggestions.length > 0 ? (
                           <div className="space-y-3">
                               <p className="text-xs text-purple-700 font-medium">Encontradas {enrichmentSuggestions.length} actualizaciones potenciales:</p>
                               {enrichmentSuggestions.map(suggestion => (
                                   <div key={suggestion.id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                                       <div className="flex justify-between items-start mb-1.5">
                                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{suggestion.field}</span>
                                           <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">{suggestion.source}</span>
                                       </div>
                                       <div className="text-sm font-medium text-slate-800 mb-2.5 break-all">{suggestion.displayValue}</div>
                                       <div className="flex gap-2">
                                           <button 
                                              onClick={() => acceptSuggestion(suggestion)}
                                              className="flex-1 bg-green-50 text-green-700 border border-green-200 py-1.5 rounded text-xs font-bold hover:bg-green-100 transition-colors"
                                           >
                                               ✓ Aceptar
                                           </button>
                                           <button 
                                              onClick={() => rejectSuggestion(suggestion.id)}
                                              className="flex-1 bg-white text-slate-500 border border-slate-200 py-1.5 rounded text-xs font-medium hover:bg-slate-50 transition-colors"
                                           >
                                               ✕ Rechazar
                                           </button>
                                       </div>
                                   </div>
                               ))}
                               {enrichmentSuggestions.length === 0 && (
                                   <div className="text-center py-2 text-xs text-green-600 font-medium">
                                       ¡Sugerencias revisadas!
                                   </div>
                               )}
                           </div>
                       ) : (
                           <>
                               <p className="text-xs text-purple-700 mb-3 leading-relaxed">
                                   Escanea fuentes de datos (LinkedIn, Firmas de Email) para enriquecer este perfil con detalles faltantes.
                               </p>
                               <button 
                                 onClick={() => triggerEnrichment(editingContact)}
                                 className="w-full py-2 bg-white border border-purple-200 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 transition-colors shadow-sm flex items-center justify-center gap-2"
                               >
                                   <span>🔍</span> Escanear Actualizaciones
                               </button>
                           </>
                       )}
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Información de Contacto</label>
                       <div className="space-y-4">
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">Email</span>
                               <input 
                                type="text" 
                                value={editingContact.email} 
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none" 
                               />
                           </div>
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">Teléfono</span>
                               <input 
                                type="text" 
                                value={editingContact.phone || ''} 
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Agregar teléfono..." 
                                className="w-full text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none" 
                               />
                           </div>
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">LinkedIn</span>
                               <div className="flex gap-2 items-center">
                                    <input 
                                        type="text" 
                                        value={editingContact.linkedin || ''} 
                                        onChange={(e) => handleInputChange('linkedin', e.target.value)}
                                        placeholder="Agregar URL LinkedIn..." 
                                        className="flex-1 text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none text-blue-600" 
                                    />
                                    {editingContact.linkedin && (
                                        <a href={editingContact.linkedin.startsWith('http') ? editingContact.linkedin : `https://${editingContact.linkedin}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600">↗</a>
                                    )}
                               </div>
                           </div>
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detalles Empresa</label>
                       <div className="space-y-4">
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">Empresa</span>
                               <input 
                                type="text" 
                                value={editingContact.company} 
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none" 
                               />
                           </div>
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">Ubicación</span>
                               <input 
                                type="text" 
                                value={editingContact.location || ''} 
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="Agregar ubicación..." 
                                className="w-full text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none" 
                               />
                           </div>
                           <div>
                               <span className="text-xs text-slate-400 block mb-1">Rol / Título</span>
                               <input 
                                type="text" 
                                value={editingContact.role || ''} 
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full text-sm border-b border-slate-200 py-1 focus:border-blue-500 focus:outline-none" 
                               />
                           </div>
                       </div>
                   </div>

                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Oportunidades Asociadas</label>
                       <div className="space-y-2">
                           {deals.filter(d => d.contactIds.includes(editingContact.id)).map(deal => (
                               <div key={deal.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                   <div className={`w-2 h-2 rounded-full 
                                       ${deal.stage === 'CLOSED' ? 'bg-green-500' : 'bg-blue-500'}
                                   `}></div>
                                   <div className="min-w-0 flex-1">
                                       <p className="text-xs font-bold text-slate-700 truncate">{deal.title}</p>
                                       <p className="text-[10px] text-slate-400">{deal.stage}</p>
                                   </div>
                               </div>
                           ))}
                           {deals.filter(d => d.contactIds.includes(editingContact.id)).length === 0 && (
                               <p className="text-xs text-slate-400 italic">No hay deals activos.</p>
                           )}
                       </div>
                   </div>

               </div>
               
               <div className="p-4 border-t border-slate-200 bg-slate-50">
                   <button 
                    onClick={() => {
                        onUpdateContact(editingContact);
                        setEditingContact(null);
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors"
                   >
                       Guardar Cambios
                   </button>
               </div>
          </div>
      )}
    </div>
  );
};