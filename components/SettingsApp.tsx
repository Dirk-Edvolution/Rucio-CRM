
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface SettingsAppProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'SALES_REP', label: 'Sales Representative' },
  { value: 'FINANCE', label: 'Finance Manager' },
  { value: 'SALES_OPS', label: 'Sales Operations' },
  { value: 'PS_MANAGER', label: 'Professional Services Mgr' },
  { value: 'DELIVERY_MANAGER', label: 'Delivery Manager' },
  { value: 'ADMIN', label: 'System Admin' },
];

export const SettingsApp: React.FC<SettingsAppProps> = ({ users, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'IAM' | 'INTEGRATIONS' | 'GENERAL'>('IAM');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate API call to Google Workspace Admin SDK
    setTimeout(() => {
        const newUsers: User[] = [
            { id: `new_${Date.now()}_1`, name: 'Emily Chen', email: 'emily@edvolution.com', role: 'SALES_REP', department: 'Sales', avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=random' },
            { id: `new_${Date.now()}_2`, name: 'Raj Patel', email: 'raj@edvolution.com', role: 'PS_MANAGER', department: 'PS', avatar: 'https://ui-avatars.com/api/?name=Raj+Patel&background=random' }
        ];
        onUpdateUsers([...users, ...newUsers]);
        setIsSyncing(false);
    }, 2000);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
      onUpdateUsers(updatedUsers);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-50">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Settings</h2>
          <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('IAM')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'IAM' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  IAM & Admin
              </button>
              <button 
                onClick={() => setActiveTab('INTEGRATIONS')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'INTEGRATIONS' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  Integrations
              </button>
              <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'GENERAL' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  General
              </button>
          </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'IAM' && (
              <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h1 className="text-2xl font-bold text-slate-800">Identity & Access Management</h1>
                          <p className="text-slate-500 mt-1">Manage user roles and sync with Google Workspace.</p>
                      </div>
                      <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors"
                      >
                          {isSyncing ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Syncing Directory...
                              </>
                          ) : (
                              <>
                                <span>🔄</span> Sync from Workspace
                              </>
                          )}
                      </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Total Users</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Admins</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.filter(u => u.role === 'ADMIN').length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Sales Reps</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.filter(u => u.role === 'SALES_REP').length}</p>
                      </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h3 className="font-bold text-slate-700">Edvolution Employees (OU: /Employees)</h3>
                          <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Search users..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-blue-500 outline-none w-64"
                              />
                              <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
                          </div>
                      </div>
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                              <tr>
                                  <th className="px-4 py-3">User</th>
                                  <th className="px-4 py-3">Department</th>
                                  <th className="px-4 py-3">Assigned Role</th>
                                  <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {filteredUsers.map(user => (
                                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-4 py-3">
                                          <div className="flex items-center gap-3">
                                              <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-100" />
                                              <div>
                                                  <p className="font-bold text-slate-800">{user.name}</p>
                                                  <p className="text-xs text-slate-500">{user.email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600">{user.department}</td>
                                      <td className="px-4 py-3">
                                          <select 
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 cursor-pointer shadow-sm w-48"
                                          >
                                              {ROLES.map(role => (
                                                  <option key={role.value} value={role.value}>{role.label}</option>
                                              ))}
                                          </select>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          <button className="text-slate-400 hover:text-blue-600">Edit</button>
                                      </td>
                                  </tr>
                              ))}
                              {filteredUsers.length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                          No users found. Try syncing or adjusting search.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}

          {activeTab === 'INTEGRATIONS' && (
              <div className="max-w-2xl mx-auto text-center py-20 text-slate-400">
                  <div className="text-5xl mb-4">🔌</div>
                  <h2 className="text-xl font-bold text-slate-700">Integrations</h2>
                  <p>Configure Odoo, Gmail, and other connectors here.</p>
              </div>
          )}

           {activeTab === 'GENERAL' && (
              <div className="max-w-2xl mx-auto text-center py-20 text-slate-400">
                  <div className="text-5xl mb-4">⚙️</div>
                  <h2 className="text-xl font-bold text-slate-700">General Settings</h2>
                  <p>System preferences and branding.</p>
              </div>
          )}
      </div>
    </div>
  );
};
