import React, { useState } from 'react';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Briefcase, User, Phone, Mail, Instagram, Facebook, MessageCircle, QrCode } from 'lucide-react';
import { getAppSettings, AppSettings } from '../services/settingsService';

export default function Register() {
  const { user, refreshProfile } = useAuth();
  const [role, setRole] = useState<'client' | 'provider' | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    phone: '',
    category: '',
    bio: '',
    whatsapp: '',
    facebook: '',
    instagram: '',
    address: {
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      coordinates: {
        lat: 0,
        lng: 0
      }
    }
  });

  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAppSettings();
      setAppSettings(settings);
    };
    fetchSettings();
  }, []);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              cep: cleanCep,
              street: data.logradouro,
              neighborhood: data.bairro,
              city: data.localidade,
              state: data.uf
            }
          }));

          // Get coordinates using Nominatim (OpenStreetMap) - FREE and no API Key required
          try {
            const query = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
            const geoData = await geoRes.json();
            if (geoData && geoData[0]) {
              const lat = parseFloat(geoData[0].lat);
              const lng = parseFloat(geoData[0].lon);
              setFormData(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  coordinates: { lat, lng }
                }
              }));
            }
          } catch (geoErr) {
            console.error('Geocoding error:', geoErr);
          }
        }
      } catch (err) {
        console.error('CEP lookup error:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Admin detection
    const isAdminEmail = user.email === 'robsonbatista3@gmail.com';
    const finalRole = isAdminEmail ? 'admin' : role;

    if (!finalRole) return;

    if (finalRole === 'provider' && !showPayment) {
      setShowPayment(true);
      return;
    }

    setLoading(true);
    try {
      const profileData = {
        uid: user.uid,
        fullName: formData.fullName,
        email: user.email,
        phone: formData.phone,
        role: finalRole,
        status: (finalRole === 'provider' || finalRole === 'admin') ? 'pending' : 'active',
        address: formData.address,
        createdAt: serverTimestamp(),
        // Admin also gets full status eventually, but let's keep it simple
        ...(finalRole === 'provider' && {
          category: formData.category,
          bio: formData.bio,
          whatsapp: formData.whatsapp,
          facebook: formData.facebook,
          instagram: formData.instagram,
          photoURL: user.photoURL || '',
        }),
        ...(finalRole === 'admin' && {
          status: 'active'
        })
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      await refreshProfile();
      navigate(finalRole === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-accent text-[10px] font-black uppercase tracking-[0.3em] shadow-sm mb-6"
          >
            <User size={12} fill="currentColor" />
            <span>Primeira Etapa</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            Como você quer usar o <span className="text-brand-accent italic">ServiAki?</span>
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto font-medium text-lg leading-relaxed">
            Personalize sua experiência escolhendo o tipo de conta que melhor atende às suas necessidades.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => setRole('client')}
            className="group p-10 bg-brand-card rounded-[2.5rem] shadow-2xl border-2 border-brand-border hover:border-brand-primary text-left transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-input rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-brand-accent group-hover:scale-110 transition-brand mb-8 shadow-inner border border-brand-border">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Sou um Contratante</h2>
              <p className="text-slate-500 font-medium leading-relaxed italic">"Preciso de ajuda com serviços em minha casa ou empresa com agilidade."</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-brand-primary/5 rounded-full blur-[60px] group-hover:bg-brand-primary/10 transition-brand"></div>
          </motion.button>

          <motion.button
            whileHover={{ y: -10 }}
            onClick={() => setRole('provider')}
            className="group p-10 bg-brand-card rounded-[2.5rem] shadow-2xl border-2 border-brand-border hover:border-brand-primary text-left transition-all relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-brand-input rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-brand-accent group-hover:scale-110 transition-brand mb-8 shadow-inner border border-brand-border">
                <Briefcase size={32} />
              </div>
              <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Sou um Prestador</h2>
              <p className="text-slate-500 font-medium leading-relaxed italic">"Quero oferecer meus serviços, divulgar meu talento e encontrar novos clientes."</p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] group-hover:bg-indigo-500/20 transition-brand"></div>
          </motion.button>
        </div>
      </div>
    );
  }

  if (showPayment && role === 'provider') {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-card rounded-[2.5rem] p-10 shadow-2xl border border-brand-border text-center overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg shadow-indigo-500/20">
              <QrCode size={32} />
            </div>
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Próxima Etapa</h1>
            <p className="text-slate-500 mb-10 font-medium italic">
              Para liberar seu perfil e aparecer em nossas buscas, realize o pagamento da assinatura.
            </p>
            
            <div className="bg-brand-input p-8 rounded-3xl mb-10 border border-brand-border-light shadow-inner relative group">
              <p className="text-[10px] text-slate-500 mb-6 font-black uppercase tracking-[0.2em]">Escaneie o QR Code abaixo</p>
              <div className="aspect-square w-full max-w-[220px] bg-white mx-auto flex items-center justify-center border-4 border-brand-card rounded-2xl shadow-2xl relative">
                <QrCode size={160} className="text-slate-200" />
                <div className="absolute inset-0 flex items-center justify-center bg-brand-card/80 backdrop-blur-[2px] opacity-100 group-hover:opacity-0 transition-brand">
                  <span className="text-[11px] font-black text-brand-accent tracking-widest uppercase bg-brand-bg px-4 py-2 rounded-xl border border-brand-border shadow-2xl">
                    PIX DINÂMICO
                  </span>
                </div>
              </div>
              <p className="mt-8 font-black text-3xl text-white tracking-tight">R$ {(appSettings?.subscriptionPrice || 29.90).toFixed(2).replace('.', ',')} <span className="text-slate-600 text-xs font-bold uppercase tracking-widest">/mês</span></p>
            </div>

            <div className="space-y-4">
              <a
                href={`https://wa.me/55${appSettings?.supportWhatsapp || '0000000000000'}?text=Olá, acabei de realizar o pagamento da assinatura no ServiAki. Meu email é ${user?.email}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-brand shadow-xl active:scale-95"
              >
                <MessageCircle size={18} />
                <span>Enviar Comprovante</span>
              </a>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-brand-primary text-white py-4 px-6 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 transition-brand shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Sincronizando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </div>
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-[80px]"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-card rounded-[2.5rem] p-10 shadow-2xl border border-brand-border"
      >
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
            {role === 'client' 
              ? <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-accent shadow-sm border border-brand-primary/20"><User size={26} /></div> 
              : <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 shadow-sm border border-indigo-500/20"><Briefcase size={26} /></div>
            }
            <span>Perfil {role === 'client' ? 'Contratante' : 'Prestador'}</span>
          </h1>
          <div className="text-[10px] bg-brand-input px-4 py-2 rounded-xl text-slate-500 font-black uppercase tracking-widest border border-brand-border shadow-inner">
            Etapa 2 de 3
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                <User size={12} className="text-brand-accent" /> <span>Nome Completo</span>
              </label>
              <input
                required
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-6 py-4 bg-brand-input border border-brand-border rounded-2xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner placeholder:text-slate-700 font-medium"
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                <Phone size={12} className="text-brand-accent" /> <span>Celular / Telefone</span>
              </label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-6 py-4 bg-brand-input border border-brand-border rounded-2xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner placeholder:text-slate-700 font-medium"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-brand-border">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Endereço (Para busca por distância)</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">CEP</label>
                <input
                  required
                  type="text"
                  maxLength={9}
                  value={formData.address.cep}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, address: { ...prev.address, cep: val } }));
                    handleCepLookup(val);
                  }}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Rua / Logradouro</label>
                <input
                  required
                  type="text"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="Rua Exemplo"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Número</label>
                <input
                  required
                  type="text"
                  value={formData.address.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, number: e.target.value } }))}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="123"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Bairro</label>
                <input
                  required
                  type="text"
                  value={formData.address.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, neighborhood: e.target.value } }))}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="Centro"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Cidade</label>
                <input
                  required
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="Sua Cidade"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">UF</label>
                <input
                  required
                  type="text"
                  maxLength={2}
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: { ...prev.address, state: e.target.value.toUpperCase() } }))}
                  className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-brand-primary transition-brand shadow-inner text-sm font-medium"
                  placeholder="SP"
                />
              </div>
            </div>
          </div>

          {role === 'provider' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-10 pt-10 border-t border-brand-border"
            >
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                  <Briefcase size={12} className="text-indigo-400" /> <span>Especialidade / Categoria</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-6 py-4 bg-brand-input border border-brand-border rounded-2xl text-white outline-none focus:border-indigo-500 transition-brand shadow-inner font-medium appearance-none cursor-pointer"
                >
                  <option value="" className="bg-brand-card">Selecione uma categoria</option>
                  <option value="Limpeza" className="bg-brand-card">Limpeza</option>
                  <option value="Reformas" className="bg-brand-card">Reformas</option>
                  <option value="Assistência Técnica" className="bg-brand-card">Assistência Técnica</option>
                  <option value="Eventos" className="bg-brand-card">Eventos</option>
                  <option value="Aulas e Cursos" className="bg-brand-card">Aulas e Cursos</option>
                  <option value="Design e Tecnologia" className="bg-brand-card">Design e Tecnologia</option>
                  <option value="Outros" className="bg-brand-card">Outros</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                  <Mail size={12} className="text-indigo-400" /> <span>Descreva seus Serviços (Bio)</span>
                </label>
                <textarea
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-6 py-4 bg-brand-input border border-brand-border rounded-2xl text-white outline-none focus:border-indigo-500 transition-brand shadow-inner min-h-[140px] placeholder:text-slate-700 font-medium italic"
                  placeholder="Conte um pouco sobre seu talento e experiência..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                    <MessageCircle size={12} className="text-green-500" /> <span>WhatsApp</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-green-500 transition-brand shadow-inner placeholder:text-slate-700 text-sm font-medium"
                    placeholder="Link ou Número"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                    <Facebook size={12} className="text-blue-500" /> <span>Facebook</span>
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                    className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-blue-500 transition-brand shadow-inner placeholder:text-slate-700 text-sm font-medium"
                    placeholder="Link perfil"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1 ml-1">
                    <Instagram size={12} className="text-pink-500" /> <span>Instagram</span>
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="w-full px-5 py-3.5 bg-brand-input border border-brand-border rounded-xl text-white outline-none focus:border-pink-500 transition-brand shadow-inner placeholder:text-slate-700 text-sm font-medium"
                    placeholder="@seu_perfil"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-5 px-6 rounded-2xl font-black text-sm uppercase tracking-[0.3em] hover:bg-brand-accent transition-brand shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-95 group flex items-center justify-center gap-4"
            >
              <span>{role === 'provider' ? 'PRÓXIMO: PAGAMENTO' : (loading ? 'SINCRONIZANDO...' : 'FINALIZAR CADASTRO')}</span>
              <div className="w-1 h-1 bg-white rounded-full animate-ping group-hover:scale-150 transition-brand"></div>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
