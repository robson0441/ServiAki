import React from 'react';
import { UserProfile } from '../types';
import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../App';
import { calculateDistance, formatDistance } from '../lib/distance';

interface ProviderCardProps {
  provider: UserProfile;
}

const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const { profile } = useAuth();

  const distance = React.useMemo(() => {
    if (!profile?.address?.coordinates || !provider.address?.coordinates) return null;
    const { lat: lat1, lng: lng1 } = profile.address.coordinates;
    const { lat: lat2, lng: lng2 } = provider.address.coordinates;
    if (lat1 === 0 || lng1 === 0 || lat2 === 0 || lng2 === 0) return null;
    return calculateDistance(lat1, lng1, lat2, lng2);
  }, [profile, provider]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="bg-brand-card rounded-3xl shadow-lg border border-brand-border overflow-hidden flex flex-col group transition-brand hover:border-brand-border-light hover:shadow-indigo-500/10"
    >
      <div className="h-28 bg-[#1B1E24] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-40 group-hover:opacity-60 transition-brand"></div>
        <div className="absolute -bottom-8 left-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-card p-1 shadow-2xl shadow-black/50 overflow-hidden border border-brand-border relative z-10">
            {provider.photoURL ? (
              <img 
                src={provider.photoURL} 
                alt={provider.fullName} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-2xl">
                {provider.fullName[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-12 p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-brand-accent transition-brand truncate pr-2">
            {provider.fullName}
          </h3>
          <div className="flex items-center space-x-1 text-yellow-500 text-xs font-black bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
            <Star size={12} fill="currentColor" />
            <span>4.9</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-brand-accent font-bold text-[10px] uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-brand">
            <Briefcase size={12} className="mr-1" />
            {provider.category}
          </div>
          {distance !== null && (
            <div className="flex items-center text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-brand-bg px-2 py-1 rounded-lg border border-brand-border shadow-inner">
              <MapPin size={10} className="mr-1 text-brand-accent" />
              {formatDistance(distance)}
            </div>
          )}
        </div>

        <p className="text-slate-400 text-sm line-clamp-2 mb-6 h-10 italic leading-relaxed">
          "{provider.bio}"
        </p>

        <div className="mt-auto pt-6 border-t border-brand-border flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <MapPin size={12} className="mr-1 text-slate-600" />
              {provider.address?.city || 'Localização não informada'}
            </div>
          </div>
          <Link
            to={`/profile/${provider.uid}`}
            className="flex items-center space-x-1 text-xs font-black uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-brand group/btn"
          >
            <span>Ver Perfil</span>
            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProviderCard;
