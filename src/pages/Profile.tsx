import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../App';
import { UserProfile } from '../types';
import { 
  Star, 
  MessageCircle, 
  Facebook, 
  Instagram, 
  ArrowLeft, 
  Heart, 
  Share2, 
  Clock, 
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import { motion } from 'motion/react';
import ReviewSection from '../components/ReviewSection';
import { calculateDistance, formatDistance } from '../lib/distance';
import { MapPin } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const { user, profile: currentUserProfile } = useAuth();
  const [provider, setProvider] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  const distance = React.useMemo(() => {
    if (!currentUserProfile?.address?.coordinates || !provider?.address?.coordinates) return null;
    const { lat: lat1, lng: lng1 } = currentUserProfile.address.coordinates;
    const { lat: lat2, lng: lng2 } = provider.address.coordinates;
    if (lat1 === 0 || lng1 === 0 || lat2 === 0 || lng2 === 0) return null;
    return calculateDistance(lat1, lng1, lat2, lng2);
  }, [currentUserProfile, provider]);

  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;
      const docSnap = await getDoc(doc(db, 'users', id));
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const isOwner = user?.uid === id;
        
        if (isOwner || (data.role === 'provider' && data.status === 'active')) {
          setProvider(data);
          // Check if favorited if logged in
          if (user && !isOwner) {
            const favSnap = await getDoc(doc(db, 'clients', user.uid, 'favorites', id));
            setIsFavorite(favSnap.exists());
          }
        } else {
          setProvider(null);
        }
      }
      setLoading(false);
    };

    fetchProvider();
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }

    const favRef = doc(db, 'clients', user.uid, 'favorites', id);
    if (isFavorite) {
      await deleteDoc(favRef);
      setIsFavorite(false);
    } else {
      await setDoc(favRef, {
        clientId: user.uid,
        providerId: id,
        createdAt: new Date()
      });
      setIsFavorite(true);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!provider) return <div className="text-center py-20 text-gray-500">Perfil não encontrado ou aguardando aprovação.</div>;

  const whatsappMessage = `Olá ${provider.fullName}, vi seu perfil no ServiAki e gostaria de solicitar um orçamento para ${provider.category}.`;
  const whatsappUrl = `https://wa.me/${provider.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-6xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-brand font-bold text-xs uppercase tracking-widest bg-brand-card px-5 py-2.5 rounded-xl border border-brand-border shadow-sm active:scale-95"
      >
        <ArrowLeft size={16} />
        <span>Voltar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-brand-card rounded-[2.5rem] p-8 shadow-2xl border border-brand-border text-center relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="relative inline-block mb-8">
                <div className="w-44 h-44 rounded-[2rem] overflow-hidden bg-brand-input border-4 border-brand-card shadow-2xl mx-auto transition-brand hover:scale-105">
                  {provider.photoURL ? (
                    <img src={provider.photoURL} alt={provider.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-slate-700">
                      {provider.fullName[0]}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl border-4 border-brand-card shadow-lg ring-1 ring-green-400/20">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-white mb-2 leading-tight">{provider.fullName}</h1>
              
              <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
                <p className="text-brand-accent font-black bg-brand-primary/10 px-5 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-brand-primary/20">
                  {provider.category}
                </p>
                {distance !== null && (
                  <div className="flex items-center text-slate-400 font-black bg-brand-input px-5 py-1.5 rounded-xl text-[10px] uppercase tracking-widest border border-brand-border shadow-inner">
                    <MapPin size={12} className="mr-2 text-brand-accent" />
                    <span>{formatDistance(distance)} DE DISTÂNCIA</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center text-slate-500 mb-6 font-bold text-xs">
                <MapPin size={14} className="mr-1 text-slate-600" />
                <span>{provider.address?.city}, {provider.address?.state}</span>
              </div>

              <div className="flex items-center justify-center space-x-1 text-yellow-500 mb-8 px-4 py-2 bg-brand-input rounded-2xl border border-brand-border inline-flex">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= 4 ? "currentColor" : "none"} />)}
                <span className="text-white font-black ml-2">4.9</span>
                <span className="text-slate-500 text-xs font-bold ml-1 tracking-tighter">(24 AVALIAÇÕES)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={toggleFavorite}
                  className={`flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-brand border-2 active:scale-95 ${
                    isFavorite 
                    ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                    : 'bg-brand-input border-brand-border text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                  <span>Favoritar</span>
                </button>
                <button className="flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-brand-input border-2 border-brand-border text-slate-400 hover:text-white hover:border-slate-700 transition-brand active:scale-95">
                  <Share2 size={16} />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-brand-primary rounded-[2rem] p-8 shadow-2xl text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                <MessageCircle size={24} />
                <span>Contatos</span>
              </h3>
              <div className="space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between bg-white text-indigo-700 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-brand shadow-xl"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle size={18} />
                    <span>WhatsApp</span>
                  </span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </a>
                {provider.instagram && (
                  <a
                    href={`https://instagram.com/${provider.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 bg-white/10 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-brand border border-white/20"
                  >
                    <Instagram size={18} />
                    <span>Instagram</span>
                  </a>
                )}
                {provider.facebook && (
                  <a
                    href={provider.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 bg-white/10 p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-brand border border-white/20"
                  >
                    <Facebook size={18} />
                    <span>Facebook</span>
                  </a>
                )}
              </div>
              
              <p className="mt-8 text-[10px] text-indigo-200 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                <Clock size={12} />
                <span>Resposta em ~30 min</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-card rounded-[2.5rem] p-10 shadow-sm border border-brand-border"
          >
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
              <User size={26} className="text-brand-accent" />
              <span>Sobre o Profissional</span>
            </h2>
            <div className="bg-brand-input p-8 rounded-3xl border border-brand-border-light shadow-inner">
              <p className="text-slate-400 leading-[1.8] text-lg whitespace-pre-line italic">
                "{provider.bio}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-10">
              <div className="bg-brand-input p-5 rounded-2xl border border-brand-border flex items-center gap-4">
                <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-accent transition-brand hover:scale-110 shadow-lg shadow-indigo-500/10"><Calendar size={22} /></div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Início</p>
                  <p className="text-sm font-bold text-white">Maio 2024</p>
                </div>
              </div>
              <div className="bg-brand-input p-5 rounded-2xl border border-brand-border flex items-center gap-4">
                <div className="p-2.5 bg-green-500/10 rounded-xl text-green-500 transition-brand hover:scale-110 shadow-lg shadow-green-500/10"><CheckCircle2 size={22} /></div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Status</p>
                  <p className="text-sm font-bold text-white">Verificado</p>
                </div>
              </div>
            </div>
          </motion.section>

          <ReviewSection providerId={id!} />
        </div>
      </div>
    </div>
  );
}
