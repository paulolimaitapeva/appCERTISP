
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { CertificateAuthority } from '../types';
import { Plus, Search, Trash2, Building, Link as LinkIcon, Pencil } from 'lucide-react';

const Authorities: React.FC = () => {
  const [acs, setAcs] = useState<CertificateAuthority[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<CertificateAuthority>>({ status: 'ACTIVE' });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setAcs(db.getACs());
  }, []);

  const handleOpenModal = (ac?: CertificateAuthority) => {
    if (ac) {
      setEditingId(ac.id);
      setFormData(ac);
    } else {
      setEditingId(null);
      setFormData({ status: 'ACTIVE' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.apiUrl) {
      if (editingId) {
        db.updateAC(editingId, formData);
      } else {
        db.addAC(formData as CertificateAuthority);
      }
      setAcs(db.getACs());
      setShowModal(false);
      setFormData({ status: 'ACTIVE' });
      setEditingId(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta autoridade certificadora?')) {
        db.deleteAC(id);
        setAcs(db.getACs());
    }
  };

  const filteredAcs = acs.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Autoridades Certificadoras</h2>
          <p className="text-gray-500">Gerencie as integrações com as ACs.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Nova AC
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar AC..." 
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
                <th className="px-6 py-3">Nome da AC</th>
                <th className="px-6 py-3">Endpoint da API</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAcs.map((ac) => (
                <tr key={ac.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    {ac.name}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-600">
                    <div className="flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" />
                        {ac.apiUrl}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ac.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {ac.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button 
                        type="button"
                        onClick={() => handleOpenModal(ac)}
                        className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors"
                        >
                        <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                        type="button"
                        onClick={(e) => handleDelete(e, ac.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAcs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Nenhuma AC encontrada.
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
                {editingId ? 'Editar Autoridade Certificadora' : 'Nova Autoridade Certificadora'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da AC</label>
                <input 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                  placeholder="Ex: Soluti, Certisign..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint da API</label>
                <input 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm text-gray-900 bg-white"
                  placeholder="https://api.exemplo.com/v1"
                  value={formData.apiUrl || ''}
                  onChange={(e) => setFormData({...formData, apiUrl: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">URL base para futuras integrações.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-900"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
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
                  {editingId ? 'Salvar Alterações' : 'Criar AC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Authorities;
