/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

import { handleFirestoreError, OperationType } from './lib/errorHandlers';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        // Auto-assign admin role if email matches
        if (auth.currentUser?.email === 'robsonbatista3@gmail.com') {
          data.role = 'admin';
        }
        setProfile(data);
      } else {
        // If doc doesn't exist but it's the admin email, create a partial profile
        if (auth.currentUser?.email === 'robsonbatista3@gmail.com') {
          setProfile({
            uid,
            email: auth.currentUser.email,
            fullName: auth.currentUser.displayName || 'Admin',
            role: 'admin',
            status: 'active',
            createdAt: new Date(),
          } as UserProfile);
        } else {
          setProfile(null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      <Router>
        <div className="flex h-screen bg-brand-bg text-slate-200 overflow-hidden font-inter">
          <Navbar />
          <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={user && !profile ? <Register /> : <Navigate to="/" />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/admin" element={profile?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
              </Routes>
            </div>
            
            <footer className="mt-auto px-8 py-6 border-t border-brand-border flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500 gap-4">
              <div>&copy; 2024 ServiAki Brasil. Todos os direitos reservados.</div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-brand-accent transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-brand-accent transition-colors">Privacidade</a>
                <a href="#" className="hover:text-brand-accent transition-colors">Suporte</a>
              </div>
            </footer>
          </main>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
