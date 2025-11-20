
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Client } from '../types';
import { fetchCnpjData } from '../services/brasilApi';
import { Plus, Search, Trash2, User as UserIcon, Building2, Pencil, Globe, Loader2 } from 'lucide-react';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({ type: 'PF' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setClients(db.getClients());
  }, []);

  const handleOpenModal = (client?: Client) => {
    setApiError('');
    if (client) {
      setEditingId(client.id);
      setFormData(client);
    } else {
      setEditingId(null);
      setFormData({ type: 'PF' });
    }
    setShowModal(true);
  };

  const handleConsultarCnpj = async () => {
    if (!formData.document) return;
    
    setLoadingCnpj(true);
    setApiError('');
    
    try {
        const data = await fetchCnpjData(formData.document);
        if (data) {
            setFormData(prev => ({
                ...prev,
                name: data.nome_fantasia || data.razao_social,
                email: data.email || prev.email,
                phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone
            }));
        }
    } catch (err: any) {
        setApiError(err.message || "Erro ao buscar dados.");
    } finally {
        setLoadingCnpj(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.document && formData.email && formData.phone) {
      if (editingId) {
        db.updateClient(editingId, formData);
      } else {
        db.addClient(formData as Client);
      }
      setClients(db.getClients());
      setShowModal(false);
      setFormData({ type: 'PF' });
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este cliente?')) {
      db.deleteClient(id);
      setClients(db.getClients());
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.document.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-gray-500">Gerencie sua base de clientes PF e PJ.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou documento..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-sm bg-white text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Documento</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Contato</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 font-mono text-xs">{client.document}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${client.type === 'PJ' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {client.type === 'PJ' ? <Building2 className="w-3 h-3"/> : <UserIcon className="w-3 h-3"/>}
                      {client.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span>{client.email}</span>
                      <span className="text-xs text-gray-400">{client.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(client)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900">
                    <input 
                      type="radio" 
                      name="type" 
                      value="PF" 
                      checked={formData.type === 'PF'} 
                      onChange={(e) => setFormData({...formData, type: 'PF' as any})}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>Pessoa Física (PF)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-900">
                    <input 
                      type="radio" 
                      name="type" 
                      value="PJ" 
                      checked={formData.type === 'PJ'} 
                      onChange={(e) => setFormData({...formData, type: 'PJ' as any})}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span>Pessoa Jurídica (PJ)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                <div className="flex gap-2">
                    <input 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                    value={formData.document || ''}
                    placeholder={formData.type === 'PJ' ? "00.000.000/0000-00" : "000.000.000-00"}
                    onChange={(e) => setFormData({...formData, document: e.target.value})}
                    />
                    {formData.type === 'PJ' && (
                        <button 
                            type="button"
                            onClick={handleConsultarCnpj}
                            disabled={loadingCnpj || !formData.document}
                            className="bg-blue-50 text-blue-600 border border-blue-100 px-3 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Consultar na Receita Federal"
                        >
                           {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin"/> : <Globe className="w-4 h-4"/>}
                           {loadingCnpj ? 'Buscando...' : 'Buscar'}
                        </button>
                    )}
                </div>
                {apiError && <p className="text-xs text-red-500 mt-1">{apiError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social</label>
                <input 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    required
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input 
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                >
                  {editingId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
