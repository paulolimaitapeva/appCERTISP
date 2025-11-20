import React, { useEffect, useState } from 'react';
import { db } from '../services/db';
import { AppointmentStatus } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, Calendar, DollarSign, TrendingUp, Briefcase, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [referenceDate, setReferenceDate] = useState(new Date());
  
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingAppointments: 0,
    unscheduledOrders: 0,
    revenueMonth: 0,
    completedMonth: 0
  });
  
  const [clientTypeData, setClientTypeData] = useState<any[]>([]);
  const [productTypeData, setProductTypeData] = useState<any[]>([]);

  const COLORS_CLIENTS = ['#ea580c', '#334155']; 
  const COLORS_PRODUCTS = ['#f97316', '#475569', '#94a3b8', '#fb923c'];

  useEffect(() => {
    const currentMonth = referenceDate.getMonth();
    const currentYear = referenceDate.getFullYear();

    const allClients = db.getClients();
    const allAppointments = db.getOrdersDisplay();
    
    const monthOrders = allAppointments.filter(a => {
        if (!a.date) return false; // Ignore orders without date for month stats
        const d = new Date(a.date);
        return d.getMonth() === currentMonth && 
               d.getFullYear() === currentYear && 
               a.status === AppointmentStatus.COMPLETED;
    });

    // Stats counters (Global or contextual depending on requirement, keeping Pending/Unscheduled global helps operations)
    const pending = allAppointments.filter(a => a.status === AppointmentStatus.SCHEDULED).length;
    const unscheduled = allAppointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    
    const revenueMonth = monthOrders.reduce((acc, curr) => acc + curr.productPrice, 0);

    // --- Chart 1 Logic ---
    let pfCount = 0;
    let pjCount = 0;
    
    monthOrders.forEach(order => {
        const client = allClients.find(c => c.id === order.clientId);
        if (client?.type === 'PJ') pjCount++;
        else if (client?.type === 'PF') pfCount++;
    });

    const cData = [
        { name: 'Pessoa Jurídica (CNPJ)', value: pjCount },
        { name: 'Pessoa Física (CPF)', value: pfCount },
    ].filter(d => d.value > 0); 

    // --- Chart 2 Logic ---
    const pMap: Record<string, number> = {};
    monthOrders.forEach(order => {
        const product = db.getProducts().find(p => p.id === order.productId);
        if (product) {
            pMap[product.type] = (pMap[product.type] || 0) + 1;
        }
    });

    const pData = Object.keys(pMap).map(key => ({
        name: key === 'CLOUD' ? 'Nuvem' : `Certificado ${key}`,
        value: pMap[key]
    }));

    setStats({
      totalClients: allClients.length,
      pendingAppointments: pending,
      unscheduledOrders: unscheduled,
      revenueMonth,
      completedMonth: monthOrders.length
    });

    setClientTypeData(cData);
    setProductTypeData(pData);

  }, [referenceDate]);

  const changeMonth = (increment: number) => {
    const newDate = new Date(referenceDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setReferenceDate(newDate);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-brand-500 flex items-start justify-between group hover:shadow-md transition-all">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass} text-white shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-sm border border-slate-700">
          <p className="font-bold mb-1">{payload[0].name}</p>
          <p className="text-brand-400">Qtd: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const referenceMonthName = referenceDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 mt-1">Visão geral de performance e agenda.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-2 min-w-[180px] justify-center font-medium text-slate-700">
                <CalendarDays className="w-4 h-4 text-brand-500" />
                <span className="capitalize">{referenceMonthName}</span>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita (Mês)" value={`R$ ${stats.revenueMonth.toFixed(2)}`} icon={DollarSign} colorClass="bg-slate-800" />
        <StatCard title="Emitidos (Mês)" value={stats.completedMonth} icon={TrendingUp} colorClass="bg-brand-500" />
        <StatCard title="Agendados (Futuros)" value={stats.pendingAppointments} icon={Calendar} colorClass="bg-brand-400" />
        <StatCard title="Pedidos (Sem Data)" value={stats.unscheduledOrders} icon={Clock} colorClass="bg-yellow-500" />
      </div>

      {/* Main Layout: List Left, Charts Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upcoming Schedule */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600"/> Próximos
            </h3>
            <button className="text-[10px] font-bold text-brand-600 hover:text-brand-700 uppercase tracking-wider border border-brand-200 px-2 py-1 rounded bg-brand-50">
                Ver Todos
            </button>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {db.getAppointments()
                .filter(a => a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.PENDING)
                .sort((a, b) => {
                    // Show scheduled first, then pending
                    if(a.date && !b.date) return -1;
                    if(!a.date && b.date) return 1;
                    if(a.date && b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
                    return 0;
                })
                .slice(0, 7)
                .map(apt => {
                  const display = db.getOrdersDisplay().find(d => d.id === apt.id);
                  const dateObj = apt.date ? new Date(apt.date) : null;

                  return (
                    <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-3 group">
                      <div className={`flex flex-col items-center justify-center bg-white border-2 w-12 h-12 rounded-lg shadow-sm group-hover:border-brand-200 transition-colors ${apt.status === AppointmentStatus.PENDING ? 'border-yellow-200 text-yellow-600' : 'border-slate-100 text-slate-600'}`}>
                        {dateObj ? (
                            <>
                                <span className="text-[10px] font-bold uppercase">{dateObj.toLocaleString('pt-BR', {month: 'short'})}</span>
                                <span className="text-lg font-bold leading-none">{dateObj.getDate()}</span>
                            </>
                        ) : (
                            <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-slate-700 text-sm truncate pr-2">{display?.clientName}</h4>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-slate-500 truncate">{display?.productName}</span>
                            {apt.status === AppointmentStatus.PENDING ? (
                                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">PENDENTE</span>
                            ) : (
                                <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {dateObj?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
             {db.getAppointments().filter(a => a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.PENDING).length === 0 && (
                <div className="p-8 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhum agendamento próximo.</p>
                </div>
             )}
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-brand-500" />
                    Perfil de Cliente
                </h3>
                <p className="text-xs text-slate-400">PF vs PJ (Concluídos)</p>
            </div>
            
            <div className="flex-1 min-h-[250px] relative">
                {clientTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={clientTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        >
                        {clientTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_CLIENTS[index % COLORS_CLIENTS.length]} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-lg">
                        <p className="text-sm">Sem dados para este mês.</p>
                    </div>
                )}
            </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    Produtos
                </h3>
                <p className="text-xs text-slate-400">Vendas por Tipo</p>
            </div>

            <div className="flex-1 min-h-[250px] relative">
                {productTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={productTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        >
                        {productTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_PRODUCTS[index % COLORS_PRODUCTS.length]} />
                        ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                    </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-lg">
                        <p className="text-sm">Sem dados para este mês.</p>
                    </div>
                )}
            </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;