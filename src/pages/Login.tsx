import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Chrome } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user profile exists
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        navigate('/');
      } else {
        navigate('/register');
      }
    } catch (err: any) {
      setError('Erro ao fazer login com Google. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-card rounded-[2.5rem] p-10 shadow-2xl border border-brand-border"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
            <Chrome className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">ServiAki</h1>
          <p className="text-slate-500 font-medium">Acesse sua conta para continuar</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm mb-8 font-bold flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-4 bg-white text-slate-900 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-brand shadow-xl active:scale-95 disabled:opacity-50 mb-10"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 shadow-sm" />
          {loading ? 'Sincronizando...' : 'Entrar com Google'}
        </button>

        <div className="relative mb-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-brand-border"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black">
            <span className="bg-brand-card px-4 text-slate-600">Segurança Total</span>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 font-medium leading-relaxed px-4">
          Ao continuar, você concorda com nossos <a href="#" className="text-indigo-400 hover:underline">Termos de Uso</a> e <a href="#" className="text-indigo-400 hover:underline">Política de Privacidade</a>.
        </p>
      </motion.div>
    </div>
  );
}
