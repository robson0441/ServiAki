import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Search,
  MoreVertical,
  Briefcase,
  ExternalLink,
  Settings,
  Save,
  Rocket,
  Database,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAppSettings, updateAppSettings, AppSettings } from '../services/settingsService';
import { generateDemoData } from '../services/demoService';

import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'demo'>('users');
  const [filter, setFilter] = useState<'all' | 'pending' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings State
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Demo State
  const [generatingDemo, setGeneratingDemo] = useState(false);
  const [demoCount, setDemoCount] = useState(10);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getAppSettings();
        setAppSettings(settings);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab !== 'users') return;
    const q = filter === 'all' 
      ? query(collection(db, 'users'))
      : query(collection(db, 'users'), where('status', '==', filter));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ ...doc.data() }) as UserProfile);
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => unsubscribe();
  }, [filter, activeTab]);

  const updateUserStatus = async (uid: string, status: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    active: users.filter(u => u.status === 'active' && u.role === 'provider').length,
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appSettings) return;
    
    setSavingSettings(true);
    try {
      await updateAppSettings(appSettings);
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGenerateDemo = async () => {
    setGeneratingDemo(true);
    try {
      await generateDemoData(demoCount);
      alert(`${demoCount} usuários e prestadores demo gerados com sucesso!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar dados demo.');
    } finally {
      setGeneratingDemo(false);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-accent text-[10px] font-black uppercase tracking-[0.3em] shadow-sm mb-4"
          >
            <ShieldCheck size={12} fill="currentColor" />
            <span>Sistema Restrito</span>
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            Dashboard <span className="text-brand-accent italic">Admin</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Controle total de usuários e parâmetros da plataforma.</p>
        </div>

        {/* Global Tabs */}
        <div className="flex bg-brand-card p-1.5 rounded-2xl border border-brand-border shadow-xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-brand ${
              activeTab === 'users' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Users size={14} />
            <span>Usuários</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-brand ${
              activeTab === 'settings' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings size={14} />
            <span>Configurações</span>
          </button>
          <button 
            onClick={() => setActiveTab('demo')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-brand ${
              activeTab === 'demo' ? 'bg-brand-primary text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Database size={14} />
            <span>Gerador de Demo</span>
          </button>
        </div>
      </header>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-card p-8 rounded-[2.5rem] shadow-2xl border border-brand-border flex items-center gap-6 relative overflow-hidden group hover:border-indigo-500/50 transition-brand"
        >
          <div className="p-5 bg-indigo-500/10 rounded-3xl text-indigo-400 shadow-inner group-hover:scale-110 transition-brand"><Users size={32} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Total Usuários</p>
            <p className="text-4xl font-black text-white tracking-tighter">{stats.total}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-brand-card p-8 rounded-[2.5rem] shadow-2xl border border-brand-border flex items-center gap-6 relative overflow-hidden group hover:border-yellow-500/50 transition-brand"
        >
          <div className="p-5 bg-yellow-500/10 rounded-3xl text-yellow-500 shadow-inner group-hover:scale-110 transition-brand"><Clock size={32} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Pendentes</p>
            <p className="text-4xl font-black text-white tracking-tighter">{stats.pending}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-brand-card p-8 rounded-[2.5rem] shadow-2xl border border-brand-border flex items-center gap-6 relative overflow-hidden group hover:border-green-500/50 transition-brand"
        >
          <div className="p-5 bg-green-500/10 rounded-3xl text-green-500 shadow-inner group-hover:scale-110 transition-brand"><CheckCircle2 size={32} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Prestadores Ativos</p>
            <p className="text-4xl font-black text-white tracking-tighter">{stats.active}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-500/5 rounded-full blur-2xl"></div>
        </motion.div>
      </div>

      {/* Filters and Table */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-card rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-brand-border overflow-hidden"
      >
        <div className="p-10 border-b border-brand-border flex flex-col lg:flex-row justify-between items-center gap-8 bg-brand-bg/30">
          <div className="flex bg-brand-input p-2 rounded-2xl border border-brand-border shadow-inner w-full lg:w-auto">
            {['all', 'pending', 'active'].map((f) => (
              <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-brand flex-1 lg:flex-none ${
                  filter === f 
                  ? 'bg-brand-primary text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Ativos'}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-primary transition-brand" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-8 py-5 bg-brand-input rounded-2xl border border-brand-border outline-none focus:border-brand-primary transition-brand font-bold text-white placeholder:text-slate-700 shadow-inner"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-brand-bg/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-brand-border">
                <th className="px-10 py-6">IDENTIDADE</th>
                <th className="px-10 py-6">FUNÇÃO / CATEGORIA</th>
                <th className="px-10 py-6">STATUS</th>
                <th className="px-10 py-6 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/50">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.uid}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-brand-card-hover transition-brand group"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-brand-input border border-brand-border flex items-center justify-center text-brand-primary font-black text-xl shrink-0 shadow-lg group-hover:scale-105 transition-brand">
                          {user.photoURL ? (
                            <img src={user.photoURL} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            user.fullName[0]
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-white text-lg group-hover:text-brand-accent transition-brand">{user.fullName}</p>
                          <p className="text-xs text-slate-500 font-medium italic">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-2">
                        {user.role === 'provider' ? (
                          <span className="flex items-center gap-2 text-[10px] font-black text-indigo-400 bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/10 w-fit">
                            <Briefcase size={12} />
                            <span>PRESTADOR</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-800 px-4 py-2 rounded-xl border border-brand-border w-fit">
                            <ShieldCheck size={12} />
                            <span>CONTRATANTE</span>
                          </span>
                        )}
                        {user.category && (
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">{user.category}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      {user.status === 'pending' ? (
                        <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/5 px-4 py-2 rounded-xl border border-yellow-500/10 w-fit text-[10px] font-black uppercase tracking-widest">
                          <Clock size={12} className="animate-pulse" />
                          <span>Pendente</span>
                        </div>
                      ) : user.status === 'active' ? (
                        <div className="flex items-center gap-2 text-green-500 bg-green-500/5 px-4 py-2 rounded-xl border border-green-500/10 w-fit text-[10px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={12} />
                          <span>Ativo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500 bg-red-500/5 px-4 py-2 rounded-xl border border-red-500/10 w-fit text-[10px] font-black uppercase tracking-widest">
                          <XCircle size={12} />
                          <span>Suspenso</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-brand">
                        {user.status === 'pending' && (
                          <button 
                            onClick={() => updateUserStatus(user.uid, 'active')}
                            className="bg-green-600 hover:bg-green-500 text-white p-3.5 rounded-2xl transition-brand shadow-lg shadow-green-600/20 active:scale-90"
                            title="Aprovar Prestador"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                        {user.status === 'active' && user.role === 'provider' && (
                          <button 
                            onClick={() => updateUserStatus(user.uid, 'suspended')}
                            className="bg-brand-input hover:bg-red-500/10 text-slate-500 hover:text-red-500 p-3.5 rounded-2xl border border-brand-border transition-brand shadow-sm active:scale-90"
                            title="Suspender Perfil"
                          >
                            <XCircle size={20} />
                          </button>
                        )}
                        {user.role === 'provider' && (
                          <a 
                            href={`/profile/${user.uid}`}
                            target="_blank"
                            className="p-3.5 bg-brand-input text-slate-500 hover:text-white rounded-2xl border border-brand-border transition-brand shadow-sm active:scale-90"
                            title="Inspecionar Perfil"
                          >
                            <ExternalLink size={20} />
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <div className="py-32 text-center bg-brand-input/30">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-input rounded-3xl text-slate-700 mb-8 shadow-inner">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Nenhum registro</h3>
              <p className="text-slate-500 max-w-xs mx-auto font-medium">Não encontramos usuários com os filtros selecionados.</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  ) : activeTab === 'settings' ? (
    <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-brand-card rounded-[3rem] p-12 shadow-2xl border border-brand-border">
            <div className="flex items-center gap-5 mb-10">
              <div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-accent border border-brand-primary/20">
                <Rocket size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Configurações Globais</h2>
                <p className="text-slate-500 text-sm font-medium">Ajuste os parâmetros fundamentais do ServiAki.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-10">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">WhatsApp de Suporte</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-accent transition-brand">
                      <Users size={20} />
                    </div>
                    <input 
                      type="text"
                      className="w-full pl-16 pr-8 py-5 bg-brand-input rounded-2xl border border-brand-border outline-none focus:border-brand-primary text-white font-bold transition-brand shadow-inner"
                      value={appSettings?.supportWhatsapp || ''}
                      onChange={(e) => setAppSettings(prev => prev ? { ...prev, supportWhatsapp: e.target.value } : null)}
                      placeholder="Ex: 81992316899"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 italic ml-1">Este número será usado para o suporte e recebimento de comprovantes.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Valor da Assinatura (R$)</label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-brand-accent transition-brand font-black text-lg">
                      R$
                    </div>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full pl-16 pr-8 py-5 bg-brand-input rounded-2xl border border-brand-border outline-none focus:border-brand-primary text-white font-bold transition-brand shadow-inner"
                      value={appSettings?.subscriptionPrice || 0}
                      onChange={(e) => setAppSettings(prev => prev ? { ...prev, subscriptionPrice: parseFloat(e.target.value) } : null)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 italic ml-1">Preço mensal exibido para novos prestadores.</p>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full md:w-auto flex items-center justify-center gap-4 bg-brand-primary text-white py-5 px-12 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-500 transition-brand shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95 group"
                >
                  <Save size={18} />
                  <span>{savingSettings ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-brand-card rounded-[3rem] p-12 shadow-2xl border border-brand-border text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent"></div>
            
            <div className="inline-flex p-6 bg-brand-primary/10 rounded-[2.5rem] text-brand-accent border border-brand-primary/20 mb-8 shadow-inner ring-8 ring-brand-bg">
              <Zap size={48} fill="currentColor" className="animate-pulse" />
            </div>

            <h2 className="text-3xl font-black text-white mb-4">Gerar Usuários e Prestadores <span className="text-brand-accent italic">Falsos</span></h2>
            <p className="text-slate-500 text-sm font-medium max-w-lg mx-auto mb-12">
              Utilize esta ferramenta para popular a plataforma com usuários reais-simulados, incluindo descrições, categorias, localizações brasileiras e <span className="text-brand-accent">comentários positivos</span>. Isso ajuda a dar vida ao sistema durante a fase inicial.
            </p>

            <div className="max-w-xs mx-auto space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Quantidade de Perfis</label>
                <div className="relative">
                  <input 
                    type="number"
                    min="1"
                    max="50"
                    value={demoCount}
                    onChange={(e) => setDemoCount(parseInt(e.target.value) || 0)}
                    className="w-full px-8 py-5 bg-brand-input rounded-2xl border border-brand-border outline-none focus:border-brand-primary text-white font-black text-2xl text-center shadow-inner"
                  />
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-slate-700 font-black text-4xl hidden lg:block opacity-20 select-none">DATA</div>
                </div>
              </div>

              <button
                onClick={handleGenerateDemo}
                disabled={generatingDemo}
                className="w-full flex items-center justify-center gap-4 bg-brand-primary text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-500 transition-brand shadow-2xl shadow-indigo-600/30 disabled:opacity-50 active:scale-95 group relative overflow-hidden"
              >
                {generatingDemo ? (
                  <>
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Gerando Dados...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} fill="currentColor" />
                    <span>Popular Plataforma</span>
                  </>
                )}
                {generatingDemo && (
                  <motion.div 
                    className="absolute inset-0 bg-indigo-400/20"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  />
                )}
              </button>
            </div>

            <div className="mt-12 pt-12 border-t border-brand-border/50 grid grid-cols-2 gap-8">
              <div className="text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  O que é gerado?
                </h4>
                <ul className="text-[11px] text-slate-500 space-y-2 font-medium">
                  <li>• Prestadores com fotos e bios</li>
                  <li>• Localizações em cidades do BR</li>
                  <li>• Categorias e Preços variados</li>
                  <li>• Avaliações reais-simuladas</li>
                </ul>
              </div>
              <div className="text-left">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                  Observação
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Os dados são gerados em lote. Você pode ver os novos usuários imediatamente na aba de listagem.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
