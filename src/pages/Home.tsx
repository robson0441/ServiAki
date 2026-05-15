import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Search, SlidersHorizontal, Star } from 'lucide-react';
import { UserProfile } from '../types';
import ProviderCard from '../components/ProviderCard';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORIES = [
  'Todos',
  'Limpeza',
  'Reformas',
  'Assistência Técnica',
  'Eventos',
  'Aulas e Cursos',
  'Design e Tecnologia',
  'Outros'
];

import { handleFirestoreError, OperationType } from '../lib/errorHandlers';

export default function Home() {
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, 'users'),
          where('role', '==', 'provider'),
          where('status', '==', 'active')
        );

        const querySnapshot = await getDocs(q);
        const providersList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        })) as UserProfile[];
        
        setProviders(providersList);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-16 px-8 overflow-hidden bg-brand-card rounded-[2.5rem] border border-brand-border shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white leading-[1.1]"
          >
            Serviços de qualidade, <br />
            <span className="text-brand-accent">na palma da sua mão.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed"
          >
            Conectamos você aos melhores profissionais autônomos com agilidade, transparência e total segurança.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="flex flex-col md:flex-row items-stretch gap-3 bg-brand-input border border-brand-border-light p-2 rounded-2xl shadow-inner">
              <div className="flex-grow flex items-center px-4 gap-3">
                <Search size={22} className="text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: Pintor, Diarista, Programador..."
                  className="w-full py-4 bg-transparent text-white outline-none placeholder:text-slate-600 font-medium text-lg"
                />
              </div>
              <button className="bg-brand-primary text-white px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-brand shadow-lg shadow-indigo-600/20 active:scale-95">
                Buscar
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full -translate-x-1/2 translate-y-1/2 blur-[100px] pointer-events-none"></div>
      </section>

      {/* Categories Bar */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Categorias Populares</h3>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-brand border shadow-sm ${
                selectedCategory === cat
                ? 'bg-brand-primary text-white border-brand-primary shadow-indigo-600/20'
                : 'bg-brand-card text-slate-400 hover:text-white hover:bg-brand-card-hover border-brand-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Providers Grid */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>Profissionais em Destaque</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          </h2>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 bg-brand-card px-4 py-2 rounded-xl border border-brand-border">
            <SlidersHorizontal size={14} />
            <span>{filteredProviders.length} RESULTADOS</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-brand-card rounded-3xl h-80 animate-pulse border border-brand-border"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredProviders.map((provider) => (
                <ProviderCard key={provider.uid} provider={provider} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredProviders.length === 0 && (
          <div className="text-center py-32 bg-brand-card rounded-[2.5rem] border-2 border-dashed border-brand-border">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-input rounded-3xl text-slate-700 mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhum resultado</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Não encontramos prestadores nesta categoria ou com este nome.</p>
          </div>
        )}
      </section>
    </div>
  );
}
