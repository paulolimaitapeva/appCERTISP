
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { generateDocumentChecklist } from '../services/geminiService';
import { Client, Product, AppointmentStatus, OrderDisplay, CertificateAuthority } from '../types';
import { Calendar, Clock, CheckCircle2, XCircle, Sparkles, FileText, Building, Pencil, Search, UserPlus, AlertCircle, Loader2, Globe, CalendarOff, CalendarCheck, Trash2 } from 'lucide-react';
import { fetchCnpjData } from '../services/brasilApi';

const Agenda: React.FC = () => {
  const [orders, setOrders] = useState<OrderDisplay[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [acs, setAcs] = useState<CertificateAuthority[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // Order Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedAcId, setSelectedAcId] = useState('');
  
  // Scheduling State
  const [schedulingMode, setSchedulingMode] = useState<'NOW' | 'LATER'>('NOW');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  // Client Search State
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Quick Client Create State
  const [newClientData, setNewClientData] = useState<Partial<Client>>({ type: 'PJ', document: '' });
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  // AI Checklist State
  const [aiChecklist, setAiChecklist] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    const rawOrders = db.getOrdersDisplay();
    // Sort: Scheduled (by date) -> Pending -> Completed/Cancelled
    const sorted = rawOrders.sort((a, b) => {
        if (a.status === AppointmentStatus.PENDING && b.status !== AppointmentStatus.PENDING) return -1;
        if (a.status !== AppointmentStatus.PENDING && b.status === AppointmentStatus.PENDING) return 1;
        
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    setOrders(sorted);
    setClients(db.getClients());
    setProducts(db.getProducts());
    setAcs(db.getACs().filter(ac => ac.status === 'ACTIVE'));
  };

  // --- Logic: Search Client ---
  const handleSearchClient = () => {
    if (!clientSearchTerm) return;
    
    const normalizedTerm = clientSearchTerm.replace(/[^\d]/g, '');
    const client = clients.find(c => 
        c.document.replace(/[^\d]/g, '') === normalizedTerm || 
        c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );

    setSearchAttempted(true);
    
    if (client) {
        setFoundClient(client);
        setSelectedClientId(client.id);
        setAiChecklist(null); 
    } else {
        setFoundClient(null);
        setSelectedClientId('');
    }
  };

  const handleClearClientSelection = () => {
    setFoundClient(null);
    setSelectedClientId('');
    setClientSearchTerm('');
    setSearchAttempted(false);
    setAiChecklist(null);
  };

  // --- Logic: Create Client (Quick) ---
  const handleOpenClientModal = () => {
    setNewClientData({ 
        type: 'PJ', 
        document: clientSearchTerm || '',
        name: '',
        email: '',
        phone: ''
    });
    setShowClientModal(true);
  }

  const handleConsultarCnpj = async () => {
    if (!newClientData.document) return;
    setLoadingCnpj(true);
    try {
        const data = await fetchCnpjData(newClientData.document);
        if (data) {
            setNewClientData(prev => ({
                ...prev,
                name: data.nome_fantasia || data.razao_social,
                email: data.email || prev.email,
                phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0,2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone
            }));
        }
    } catch (err) {
        alert('Erro ao buscar CNPJ ou não encontrado.');
    } finally {
        setLoadingCnpj(false);
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
      e.preventDefault();
      if(newClientData.name && newClientData.document) {
          const created = db.addClient(newClientData as Client);
          refreshData(); 
          setFoundClient(created);
          setSelectedClientId(created.id);
          setClientSearchTerm(created.name);
          setSearchAttempted(true);
          setShowClientModal(false);
      }
  };

  // --- Logic: AI & Modal ---
  const handleGenerateChecklist = async () => {
    if (!selectedProductId || !selectedClientId) return;

    const client = clients.find(c => c.id === selectedClientId);
    const product = products.find(p => p.id === selectedProductId);

    if (client && product) {
      setLoadingAi(true);
      setAiChecklist(null);
      const html = await generateDocumentChecklist(product.name, client.type);
      setAiChecklist(html);
      setLoadingAi(false);
    }
  };

  const handleOpenModal = (order?: OrderDisplay) => {
    refreshData(); 
    if (order) {
      setEditingId(order.id);
      setSelectedClientId(order.clientId);
      
      const c = clients.find(cl => cl.id === order.clientId);
      if (c) {
        setFoundClient(c);
        setClientSearchTerm(c.name);
        setSearchAttempted(true);
      }

      setSelectedProductId(order.productId);
      setSelectedAcId(order.acId || '');
      
      if (order.date) {
          const dateObj = new Date(order.date);
          setDate(dateObj.toISOString().split('T')[0]);
          setTime(dateObj.toTimeString().slice(0, 5));
          setSchedulingMode('NOW');
      } else {
          setDate('');
          setTime('');
          setSchedulingMode('LATER');
      }
      
      setNotes(order.notes || '');
      setAiChecklist(null); 
    } else {
      resetForm();
    }
    setShowModal(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
        alert("Selecione um cliente antes de salvar.");
        return;
    }

    let dateTime: string | undefined = undefined;
    let status = AppointmentStatus.PENDING;

    if (schedulingMode === 'NOW') {
        if (!date || !time) {
            alert("Selecione data e hora para agendar.");
            return;
        }
        dateTime = new Date(`${date}T${time}:00`).toISOString();
        status = AppointmentStatus.SCHEDULED;
    } else {
        // If "Pending" is selected, status is Pending.
        status = AppointmentStatus.PENDING;
    }

    // Nota: Removida a trava que impedia a mudança de status de COMPLETED/CANCELLED.
    // Agora, se o usuário editar, o status será recalculado com base na data (Agendado ou Pendente).
    
    const payload = {
      clientId: selectedClientId,
      productId: selectedProductId,
      acId: selectedAcId,
      date: dateTime,
      notes: notes,
      status: status
    };

    if (editingId) {
        db.updateAppointment(editingId, payload);
    } else {
        db.addAppointment(payload);
    }

    refreshData();
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedClientId('');
    setSelectedProductId('');
    setSelectedAcId('');
    setDate('');
    setTime('');
    setNotes('');
    setAiChecklist(null);
    setClientSearchTerm('');
    setFoundClient(null);
    setSearchAttempted(false);
    setSchedulingMode('NOW');
  };

  const handleStatusChange = (id: string, newStatus: AppointmentStatus) => {
    db.updateAppointmentStatus(id, newStatus);
    refreshData();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este agendamento/pedido?')) {
        db.deleteAppointment(id);
        refreshData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agenda & Pedidos</h2>
          <p className="text-gray-500">Gerencie pedidos e agendamentos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Calendar className="w-4 h-4" /> Novo Pedido
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.map((order) => {
            const dateObj = order.date ? new Date(order.date) : null;
            const isPast = dateObj && dateObj < new Date() && order.status === AppointmentStatus.SCHEDULED;
            const isPending = order.status === AppointmentStatus.PENDING;
            
            return (
            <div key={order.id} className={`bg-white p-4 rounded-xl border ${isPast ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} ${isPending ? 'border-l-4 border-l-yellow-400' : ''} shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg text-center min-w-[75px] ${isPending ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                        {dateObj ? (
                            <>
                                <span className="block text-sm font-bold">{dateObj.getDate()}</span>
                                <span className="block text-xs uppercase opacity-80">{dateObj.toLocaleString('pt-BR', { month: 'short' })}</span>
                                <span className="block text-xs font-medium mt-1 opacity-80">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                                <CalendarOff className="w-5 h-5 mb-1" />
                                <span className="text-[10px] font-bold uppercase leading-tight">Sem<br/>Data</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-800">{order.clientName}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-gray-200">
                                <Building className="w-3 h-3" /> {order.acName || 'Sem AC'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{order.productName} • <span className="font-semibold text-brand-700">R$ {order.productPrice.toFixed(2)}</span></p>
                        {order.notes && <p className="text-xs text-gray-500 mt-1 italic bg-gray-50 px-2 py-1 rounded inline-block">"{order.notes}"</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide
                    ${order.status === AppointmentStatus.SCHEDULED ? 'bg-blue-100 text-blue-800' : ''}
                    ${order.status === AppointmentStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${order.status === AppointmentStatus.COMPLETED ? 'bg-green-100 text-green-800' : ''}
                    ${order.status === AppointmentStatus.CANCELLED ? 'bg-gray-100 text-gray-500' : ''}
                `}>
                    {order.status === AppointmentStatus.SCHEDULED && 'AGENDADO'}
                    {order.status === AppointmentStatus.PENDING && 'PENDENTE'}
                    {order.status === AppointmentStatus.COMPLETED && 'CONCLUÍDO'}
                    {order.status === AppointmentStatus.CANCELLED && 'CANCELADO'}
                </span>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => handleOpenModal(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors tooltip"
                        title="Editar Pedido"
                    >
                        <Pencil className="w-5 h-5" />
                    </button>

                    <button 
                        onClick={(e) => handleDelete(e, order.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors tooltip"
                        title="Excluir"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>

                {(order.status === AppointmentStatus.SCHEDULED || order.status === AppointmentStatus.PENDING) && (
                    <div className="flex gap-1 pl-2 border-l border-gray-200">
                    <button 
                        onClick={() => handleStatusChange(order.id, AppointmentStatus.COMPLETED)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors tooltip"
                        title="Marcar como Concluído"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => handleStatusChange(order.id, AppointmentStatus.CANCELLED)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors tooltip"
                        title="Cancelar"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                    </div>
                )}
                </div>
            </div>
            );
        })}
        {orders.length === 0 && (
            <p className="text-center text-gray-400 py-8">Nenhum pedido ou agendamento registrado.</p>
        )}
      </div>

      {/* Main Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl my-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                    {editingId ? 'Editar Pedido' : 'Novo Pedido de Certificado'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="w-6 h-6" />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Column 1: Selection */}
                <div className="space-y-5">
                    
                    {/* Client Search Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Cliente</label>
                        
                        {!foundClient ? (
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <input 
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                                        placeholder="Digite CPF, CNPJ ou Nome..."
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchClient())}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleSearchClient}
                                        className="bg-brand-600 text-white px-3 py-2 rounded-lg hover:bg-brand-700"
                                    >
                                        <Search className="w-4 h-4" />
                                    </button>
                                </div>
                                {searchAttempted && (
                                    <div className="text-center py-2 animate-fade-in">
                                        <div className="text-sm text-red-500 flex items-center justify-center gap-1 mb-2">
                                            <AlertCircle className="w-4 h-4"/> Cliente não encontrado
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={handleOpenClientModal}
                                            className="text-xs bg-brand-100 text-brand-700 px-3 py-1.5 rounded-full font-medium hover:bg-brand-200 flex items-center gap-1 mx-auto"
                                        >
                                            <UserPlus className="w-3 h-3" /> Cadastrar Novo Cliente
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-white border border-blue-100 p-3 rounded-lg shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{foundClient.name}</p>
                                    <p className="text-xs text-gray-500 font-mono">{foundClient.document}</p>
                                    <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-600 mt-1 inline-block">
                                        {foundClient.type}
                                    </span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleClearClientSelection}
                                    className="text-gray-400 hover:text-red-500 p-1"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Produto</label>
                        <select 
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-900"
                        value={selectedProductId}
                        onChange={(e) => {
                            setSelectedProductId(e.target.value);
                            setAiChecklist(null);
                        }}
                        >
                        <option value="" className="text-gray-400">Selecione um produto...</option>
                        {products.map(p => <option key={p.id} value={p.id} className="text-gray-900">{p.name} - R$ {p.price}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Autoridade Certificadora (AC)</label>
                        <select 
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-900"
                        value={selectedAcId}
                        onChange={(e) => setSelectedAcId(e.target.value)}
                        >
                        <option value="" className="text-gray-400">Selecione a AC emissora...</option>
                        {acs.map(ac => <option key={ac.id} value={ac.id} className="text-gray-900">{ac.name}</option>)}
                        </select>
                    </div>

                    {/* New Scheduling Interface */}
                    <div className="bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-1 p-1 mb-3 bg-gray-200/50 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setSchedulingMode('NOW')}
                                className={`py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${schedulingMode === 'NOW' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <CalendarCheck className="w-4 h-4" /> Agendar
                            </button>
                            <button
                                type="button"
                                onClick={() => setSchedulingMode('LATER')}
                                className={`py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${schedulingMode === 'LATER' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Clock className="w-4 h-4" /> Pendente
                            </button>
                        </div>

                        {schedulingMode === 'NOW' ? (
                            <div className="grid grid-cols-2 gap-4 p-3 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                                    <input 
                                        required={schedulingMode === 'NOW'}
                                        type="date"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-900"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Hora</label>
                                    <input 
                                        required={schedulingMode === 'NOW'}
                                        type="time"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-gray-900"
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 text-center animate-fade-in">
                                <p className="text-sm text-gray-600">O pedido será criado na lista de <br/><strong>Aguardando Agendamento</strong>.</p>
                            </div>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Notas / Observações</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500 outline-none h-20 resize-none bg-white text-gray-900"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Cliente trará contrato social atualizado..."
                        />
                    </div>
                </div>

                {/* Column 2: AI Assistance */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3 text-brand-700">
                        <Sparkles className="w-5 h-5" />
                        <h4 className="font-semibold text-sm">Assistente Gemini</h4>
                    </div>
                    
                    <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 text-sm text-gray-600 overflow-y-auto max-h-[400px]">
                        {!selectedClientId || !selectedProductId ? (
                            <p className="text-gray-400 italic text-center mt-20">
                                Selecione um cliente e um produto para gerar a lista de documentos necessária com IA.
                            </p>
                        ) : (
                            <>
                                {loadingAi ? (
                                    <div className="flex items-center justify-center h-full gap-2 text-brand-600">
                                        <Loader2 className="animate-spin w-4 h-4"/>
                                        Gerando checklist...
                                    </div>
                                ) : aiChecklist ? (
                                    <div>
                                        <p className="font-bold text-gray-800 mb-2 border-b pb-2">Documentos Sugeridos:</p>
                                        <div 
                                            className="prose prose-sm prose-ul:list-disc prose-ul:pl-4" 
                                            dangerouslySetInnerHTML={{__html: aiChecklist}} 
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center mt-20">
                                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                        <button 
                                            type="button"
                                            onClick={handleGenerateChecklist}
                                            className="text-brand-600 font-medium hover:text-brand-800 underline"
                                        >
                                            Gerar Checklist de Documentos
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium shadow-lg shadow-brand-200"
                >
                  {editingId ? 'Atualizar Pedido' : 'Salvar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
             <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200">
                 <h3 className="text-lg font-bold text-gray-900 mb-4">Cadastro Rápido de Cliente</h3>
                 <form onSubmit={handleCreateClient} className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Tipo</label>
                        <div className="flex gap-3">
                            <label className="inline-flex items-center text-sm text-gray-900">
                                <input type="radio" name="type" value="PJ" 
                                    checked={newClientData.type === 'PJ'} 
                                    onChange={() => setNewClientData({...newClientData, type: 'PJ'})} 
                                    className="mr-1" /> PJ
                            </label>
                            <label className="inline-flex items-center text-sm text-gray-900">
                                <input type="radio" name="type" value="PF" 
                                    checked={newClientData.type === 'PF'} 
                                    onChange={() => setNewClientData({...newClientData, type: 'PF'})} 
                                    className="mr-1" /> PF
                            </label>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Documento</label>
                        <div className="flex gap-2">
                            <input 
                                required
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                                value={newClientData.document}
                                onChange={(e) => setNewClientData({...newClientData, document: e.target.value})}
                            />
                            {newClientData.type === 'PJ' && (
                                <button 
                                    type="button"
                                    onClick={handleConsultarCnpj}
                                    disabled={loadingCnpj}
                                    className="bg-gray-100 hover:bg-gray-200 px-2 rounded text-gray-700 border border-gray-300"
                                    title="Buscar CNPJ"
                                >
                                    {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin text-brand-600"/> : <Globe className="w-4 h-4"/>}
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Nome / Razão</label>
                        <input 
                            required
                            className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                            value={newClientData.name}
                            onChange={(e) => setNewClientData({...newClientData, name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                            <input 
                                required
                                type="email"
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                                value={newClientData.email}
                                onChange={(e) => setNewClientData({...newClientData, email: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                            <input 
                                required
                                className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none text-gray-900 bg-white"
                                value={newClientData.phone}
                                onChange={(e) => setNewClientData({...newClientData, phone: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowClientModal(false)} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded border border-gray-300">Cancelar</button>
                        <button type="submit" className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700">Cadastrar</button>
                    </div>
                 </form>
             </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
