import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, ShieldCheck, Search, Star, Home, Heart, Briefcase, Menu, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { getAppSettings, AppSettings } from '../services/settingsService';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAppSettings();
      setAppSettings(settings);
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
    setIsOpen(false);
  };

  const menuItems = [
    { label: 'Explorar Serviços', icon: Home, path: '/', show: true },
    { label: 'Admin Panel', icon: ShieldCheck, path: '/admin', show: profile?.role === 'admin' },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col p-6 bg-brand-card border-r border-brand-border">
      <div className="flex items-center gap-3 mb-10 px-2">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-space">ServiAki</span>
        </Link>
      </div>

      <nav className="flex-grow space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-3">Discovery</p>
          {menuItems.filter(item => item.show).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-brand font-medium group ${
                location.pathname === item.path
                  ? 'bg-brand-primary/10 text-brand-accent shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-brand-card-hover'
              }`}
            >
              <item.icon size={18} className="transition-transform group-hover:scale-110" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 mb-3">CONTA</p>
          {!user ? (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-brand-card-hover transition-brand border border-dashed border-slate-800"
            >
              <User size={18} />
              <span className="text-sm font-medium">Entrar / Cadastro</span>
            </Link>
          ) : (
            <>
              <div className="px-3 py-4 bg-brand-bg rounded-2xl border border-brand-border shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold border border-brand-border">
                    {profile?.fullName?.[0] || user.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-white truncate">{profile?.fullName || 'Usuário'}</span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">{profile?.role || 'Visitante'}</span>
                  </div>
                </div>
                {profile?.role === 'provider' && profile?.status === 'pending' && (
                  <div className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded-md font-bold mb-3 flex items-center gap-1">
                    <Star size={10} /> AGUARDANDO APROVAÇÃO
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-brand"
                >
                  <LogOut size={14} /> Sair da conta
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      <div className="mt-10 p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
        <div className="relative z-10">
          <h4 className="text-sm font-bold text-white mb-2 italic">Precisa de ajuda?</h4>
          <p className="text-[10px] text-indigo-100 mb-4 opacity-80">Fale com nosso suporte especializado no WhatsApp.</p>
          <a
            href={`https://wa.me/55${appSettings?.supportWhatsapp || '0000000000000'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-white text-indigo-600 py-2 rounded-lg text-xs font-black shadow-sm hover:scale-105 transition-transform"
          >
            SUPORTE 24H
          </a>
        </div>
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-brand"></div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-full shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Toggle & Menu */}
      <div className="lg:hidden fixed top-4 right-4 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-brand-card border border-brand-border rounded-2xl text-white shadow-2xl"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 w-80 h-full lg:hidden overflow-y-auto"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
