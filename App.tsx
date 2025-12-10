
import React, { useState, useCallback, useMemo } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { Sidebar } from './components/Sidebar';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { IntegrationsPanel } from './components/IntegrationsPanel';
import { ContactsApp } from './components/ContactsApp';
import { SettingsApp } from './components/SettingsApp';
import { SmartSearchBar } from './components/SmartSearchBar';
import { Deal, Stage, initialDeals, ViewMode, STAGES, initialContacts, Contact, User, initialUsers } from './types';

const App: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentView, setCurrentView] = useState<ViewMode>('BOARD');
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  
  // Auth State (Simulated)
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // Default to Alex Sales

  // Filter State
  const [filterQuery, setFilterQuery] = useState('');
  
  // State to handle deep linking to Contacts from a Deal
  const [contactsFilterDealId, setContactsFilterDealId] = useState<string | null>(null);

  // --- Filtering Logic ---
  const filteredDeals = useMemo(() => {
      return deals.filter(deal => {
          // 1. Permission Check
          if (currentUser.role === 'SALES_REP' && deal.ownerId !== currentUser.id) {
              return false;
          }

          // 2. Smart Search Check
          if (!filterQuery) return true;

          const lowerQuery = filterQuery.toLowerCase();
          
          // Check for specific prefixes if present (simple implementation)
          if (lowerQuery.includes('country:')) {
             const country = lowerQuery.split('country:')[1]?.split(' ')[0];
             if (country && !deal.country.toLowerCase().includes(country)) return false;
          }
          if (lowerQuery.includes('stage:')) {
             const stage = lowerQuery.split('stage:')[1]?.split(' ')[0];
             if (stage && !deal.stage.toLowerCase().includes(stage)) return false;
          }

          // General text search (title, company, contact)
          // Only apply general search if the part isn't a prefix
          const generalTerms = lowerQuery.split(' ').filter(part => !part.includes(':'));
          if (generalTerms.length > 0) {
              const term = generalTerms.join(' ');
              return (
                  deal.title.toLowerCase().includes(term) ||
                  deal.company.toLowerCase().includes(term) ||
                  deal.contactName.toLowerCase().includes(term)
              );
          }

          return true;
      });
  }, [deals, currentUser, filterQuery]);

  const handleDragEnd = useCallback((dealId: string, newStage: Stage) => {
    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId ? { ...deal, stage: newStage } : deal
      )
    );
  }, []);

  const handleOpenCanvas = useCallback((dealId: string) => {
    setActiveDealId(dealId);
    setCurrentView('CANVAS');
  }, []);

  const handleCloseCanvas = useCallback(() => {
    setActiveDealId(null);
    setCurrentView('BOARD');
  }, []);

  const handleOpenContacts = useCallback((filterDealId?: string) => {
      setContactsFilterDealId(filterDealId || null);
      setCurrentView('CONTACTS');
  }, []);

  const handleUpdateContact = useCallback((updatedContact: Contact) => {
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  }, []);

  const activeDeal = deals.find(d => d.id === activeDealId);
  const activeStageLabel = activeDeal ? STAGES.find(s => s.id === activeDeal.stage)?.label : '';

  // Quick User Switcher for Demo Purposes (Dropdown in Settings or Header)
  const handleUserSwitch = (userId: string) => {
      const u = users.find(user => user.id === userId);
      if (u) setCurrentUser(u);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header - Context Aware */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 gap-4">
            {currentView === 'BOARD' ? (
                <>
                    <div className="flex-1 max-w-2xl">
                        <SmartSearchBar onSearch={setFilterQuery} currentUserRole={currentUser.role} />
                    </div>
                    
                    {/* Role Switcher for Testing */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 hidden lg:inline">Viewing as:</span>
                        <select 
                            value={currentUser.id} 
                            onChange={(e) => handleUserSwitch(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                        </select>
                    </div>
                </>
            ) : currentView === 'CANVAS' && activeDeal ? (
                <>
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-800">Workspace: {activeDeal.title}</h1>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            activeDeal.stage === 'DISCOVER' ? 'bg-purple-100 text-purple-800' :
                            activeDeal.stage === 'UNDERSTAND' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                        }`}>
                            {activeStageLabel} Phase
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-slate-700">{currentUser.name}</span>
                    </div>
                </>
            ) : (
                 <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800 capitalize">
                        {currentView === 'SETTINGS' ? 'Settings & Profile' : currentView.toLowerCase()}
                    </h1>
                </div>
            )}
        </header>

        {/* Dynamic View */}
        <div className="flex-1 overflow-hidden relative">
          {currentView === 'BOARD' ? (
            <div className="h-full overflow-x-auto p-6">
              <KanbanBoard 
                deals={filteredDeals} 
                onDragEnd={handleDragEnd} 
                onOpenCanvas={handleOpenCanvas} 
              />
            </div>
          ) : currentView === 'CONTACTS' ? (
              <ContactsApp 
                contacts={contacts} 
                deals={deals} 
                onUpdateContact={handleUpdateContact}
                initialFilterDealId={contactsFilterDealId}
              />
          ) : currentView === 'ANALYTICS' ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-4xl shadow-sm">
                      📊
                  </div>
                  <h2 className="text-xl font-bold text-slate-700 mb-2">Analytics Dashboard</h2>
                  <p className="max-w-md text-center text-slate-500">
                      Deep insights into pipeline velocity, conversion rates, and revenue forecasting are being calculated. Check back soon.
                  </p>
              </div>
          ) : currentView === 'SETTINGS' ? (
              <SettingsApp 
                users={users}
                onUpdateUsers={setUsers}
              />
          ) : (
            <div className="h-full flex flex-col">
              {activeDeal ? (
                <CanvasWorkspace 
                  deal={activeDeal} 
                  contacts={contacts}
                  onClose={handleCloseCanvas}
                  onUpdateDeal={(updatedDeal) => {
                    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
                  }}
                  onOpenContacts={() => handleOpenContacts(activeDeal.id)}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  Select a deal to open workspace
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Right Integrations Panel - Show only on Board and Canvas */}
      {currentView !== 'CONTACTS' && currentView !== 'SETTINGS' && currentView !== 'ANALYTICS' && (
        <aside className="w-80 border-l border-slate-200 bg-white hidden xl:flex flex-col shrink-0 z-20">
            <IntegrationsPanel activeDeal={activeDeal} />
        </aside>
      )}
    </div>
  );
};

export default App;
