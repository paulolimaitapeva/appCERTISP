
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Products from './components/Products';
import Agenda from './components/Agenda';
import Authorities from './components/Authorities';
import { db } from './services/db';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  // Pré-preenchimento para facilitar o acesso demo
  const [credentials, setCredentials] = useState({ email: 'admin@certflow.com', password: 'admin' });
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Autenticação usando o "banco de dados" simulado
    const user = db.authenticate(credentials.email, credentials.password);

    if (user) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Tente admin@certflow.com / admin');
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'clients': return <Clients />;
      case 'products': return <Products />;
      case 'agenda': return <Agenda />;
      case 'acs': return <Authorities />;
      default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="p-8 text-center bg-brand-50 border-b border-brand-100">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <ShieldCheck className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">CERTI SP</h1>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {loginError}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
              <div className="relative">
                <input 
                  type="email" 
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="seu@email.com"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <input 
                  type="password" 
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
                <Lock className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-transform active:scale-[0.98] shadow-lg shadow-brand-200"
            >
              Entrar no Sistema
            </button>

            <div className="text-center">
                <p className="text-xs text-gray-400 mt-4">
                    Frontend Demo Mode <br/>
                    (Mocking Flask/PostgreSQL Backend) <br/>
                    User: admin@certflow.com | Pass: admin
                </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onLogout={() => setIsAuthenticated(false)}
      />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default App;
