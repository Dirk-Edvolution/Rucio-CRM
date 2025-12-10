
import React, { useState } from 'react';
import { User, UserRole, ExchangeRates } from '../types';

interface SettingsAppProps {
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  exchangeRates: ExchangeRates;
  onUpdateExchangeRates: (rates: ExchangeRates) => void;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'SALES_REP', label: 'Representante de Ventas' },
  { value: 'FINANCE', label: 'Gerente Financiero' },
  { value: 'SALES_OPS', label: 'Operaciones de Ventas' },
  { value: 'PS_MANAGER', label: 'Gerente de Servicios Prof.' },
  { value: 'DELIVERY_MANAGER', label: 'Gerente de Entrega' },
  { value: 'ADMIN', label: 'Admin del Sistema' },
];

export const SettingsApp: React.FC<SettingsAppProps> = ({ users, onUpdateUsers, exchangeRates, onUpdateExchangeRates }) => {
  const [activeTab, setActiveTab] = useState<'IAM' | 'INTEGRATIONS' | 'GENERAL' | 'FINANCE'>('IAM');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate API call to Google Workspace Admin SDK
    setTimeout(() => {
        const newUsers: User[] = [
            { id: `new_${Date.now()}_1`, name: 'Emily Chen', email: 'emily@edvolution.com', role: 'SALES_REP', department: 'Ventas', avatar: 'https://ui-avatars.com/api/?name=Emily+Chen&background=random' },
            { id: `new_${Date.now()}_2`, name: 'Raj Patel', email: 'raj@edvolution.com', role: 'PS_MANAGER', department: 'Servicios', avatar: 'https://ui-avatars.com/api/?name=Raj+Patel&background=random' }
        ];
        onUpdateUsers([...users, ...newUsers]);
        setIsSyncing(false);
    }, 2000);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
      const updatedUsers = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
      onUpdateUsers(updatedUsers);
  };

  const handleRateChange = (currency: keyof ExchangeRates, value: string) => {
      onUpdateExchangeRates({
          ...exchangeRates,
          [currency]: parseFloat(value) || 0
      });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full bg-slate-50">
      {/* Settings Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Configuración</h2>
          <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('IAM')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'IAM' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  Gestión de Acceso (IAM)
              </button>
              <button 
                onClick={() => setActiveTab('INTEGRATIONS')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'INTEGRATIONS' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  Integraciones
              </button>
              <button 
                onClick={() => setActiveTab('FINANCE')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'FINANCE' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  Finanzas y Monedas
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
                          <h1 className="text-2xl font-bold text-slate-800">Gestión de Identidad y Acceso</h1>
                          <p className="text-slate-500 mt-1">Administra roles de usuario y sincroniza con Google Workspace.</p>
                      </div>
                      <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-70 transition-colors"
                      >
                          {isSyncing ? (
                              <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Sincronizando...
                              </>
                          ) : (
                              <>
                                <span>🔄</span> Sincronizar con Workspace
                              </>
                          )}
                      </button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Usuarios Totales</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Admins</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.filter(u => u.role === 'ADMIN').length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <p className="text-xs text-slate-500 font-bold uppercase">Vendedores</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{users.filter(u => u.role === 'SALES_REP').length}</p>
                      </div>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                          <h3 className="font-bold text-slate-700">Empleados Edvolution (OU: /Empleados)</h3>
                          <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Buscar usuarios..." 
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
                                  <th className="px-4 py-3">Usuario</th>
                                  <th className="px-4 py-3">Departamento</th>
                                  <th className="px-4 py-3">Rol Asignado</th>
                                  <th className="px-4 py-3 text-right">Acciones</th>
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
                                          <button className="text-slate-400 hover:text-blue-600">Editar</button>
                                      </td>
                                  </tr>
                              ))}
                              {filteredUsers.length === 0 && (
                                  <tr>
                                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                          No se encontraron usuarios.
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
                  <h2 className="text-xl font-bold text-slate-700">Integraciones</h2>
                  <p>Configura Odoo, Gmail y otros conectores aquí.</p>
              </div>
          )}

          {activeTab === 'FINANCE' && (
              <div className="max-w-4xl mx-auto">
                   <div className="mb-8">
                       <h1 className="text-2xl font-bold text-slate-800">Configuración Financiera (Trimestral)</h1>
                       <p className="text-slate-500 mt-1">Define los tipos de cambio para la conversión de órdenes de venta en Odoo.</p>
                   </div>

                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Tasas de Cambio (Base: USD)</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">EUR (Euro)</label>
                               <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">€</span>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={exchangeRates.EUR}
                                        onChange={(e) => handleRateChange('EUR', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                    />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">CLP (Peso Chileno)</label>
                               <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                    <input 
                                        type="number"
                                        step="1"
                                        value={exchangeRates.CLP}
                                        onChange={(e) => handleRateChange('CLP', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                    />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">MXN (Peso MX)</label>
                               <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        value={exchangeRates.MXN}
                                        onChange={(e) => handleRateChange('MXN', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                    />
                               </div>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">COP (Peso Col.)</label>
                               <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">$</span>
                                    <input 
                                        type="number"
                                        step="10"
                                        value={exchangeRates.COP}
                                        onChange={(e) => handleRateChange('COP', e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                                    />
                               </div>
                           </div>
                       </div>
                       <p className="text-[10px] text-slate-400 mt-4 italic">
                           * Estas tasas se usarán por defecto al calcular el valor en moneda local para Odoo. Pueden sobrescribirse en cada oportunidad.
                       </p>
                   </div>
              </div>
          )}

           {activeTab === 'GENERAL' && (
              <div className="max-w-4xl mx-auto">
                   <div className="mb-8">
                       <h1 className="text-2xl font-bold text-slate-800">Configuración General</h1>
                       <p className="text-slate-500 mt-1">Preferencias del sistema y marca.</p>
                   </div>

                   {/* Placeholder for other settings */}
                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                       <h3 className="font-bold text-slate-800 mb-2">Tema de la Interfaz</h3>
                       <div className="flex gap-4">
                           <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-900 cursor-pointer"></div>
                           <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 cursor-pointer"></div>
                       </div>
                       <p className="text-xs text-slate-400 mt-2">Actualmente el modo oscuro no está disponible.</p>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};
