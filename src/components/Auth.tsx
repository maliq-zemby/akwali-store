import React, { useState } from 'react';
import { auth, db } from '@/src/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { notifyEvent } from '@/src/lib/notifications';
import { motion } from 'motion/react';
import { ShoppingBag, User, Store, Mail, Lock, Phone, MapPin, Building2 } from 'lucide-react';

export const Auth: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'Client' | 'Commerçant'>('Client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const profileData = {
          uid: user.uid,
          email: user.email,
          role,
          createdAt: serverTimestamp(),
          ...(role === 'Commerçant' ? { shopName, phone, city } : {})
        };
        
        await setDoc(doc(db, 'users', user.uid), profileData);
        await notifyEvent('SIGNUP', email, { role });
      }
      onAuth();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Side: Image & Branding */}
      <div className="hidden lg:flex relative overflow-hidden bg-gabon-blue items-center justify-center p-20">
        <img 
          src="/images/hero_marketplace_1793308827106.jpg" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale mix-blend-overlay"
          alt="Branding"
        />
        <div className="relative z-10 text-white max-w-lg">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
          >
            <ShoppingBag className="h-8 w-8 text-gabon-blue" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black tracking-tight mb-6 leading-none"
          >
            AKWALI <br /> <span className="text-gabon-yellow">STORE.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/70 font-medium"
          >
            Découvrez la nouvelle dimension du commerce au Gabon. Rejoignez des milliers d'utilisateurs dès aujourd'hui.
          </motion.p>
        </div>
        
        {/* Flag Decoration */}
        <div className="absolute bottom-10 left-10 flex gap-1">
          <div className="w-12 h-2 bg-gabon-green rounded-full" />
          <div className="w-12 h-2 bg-gabon-yellow rounded-full" />
          <div className="w-12 h-2 bg-gabon-blue rounded-full" />
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center p-8 md:p-16 bg-slate-50 lg:bg-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Bienvenue.' : 'Créer un compte.'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Ravis de vous revoir ! Connectez-vous pour continuer.' : 'Commencez votre voyage avec nous.'}
            </p>
          </div>

          {!isLogin && (
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8">
              <button
                onClick={() => setRole('Client')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                  role === 'Client' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <User className="h-4 w-4" /> Client
              </button>
              <button
                onClick={() => setRole('Commerçant')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                  role === 'Commerçant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Store className="h-4 w-4" /> Commerçant
              </button>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 text-sm font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gabon-blue/20 focus:border-gabon-blue transition-all outline-none font-medium"
                  placeholder="Adresse e-mail"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gabon-blue/20 focus:border-gabon-blue transition-all outline-none font-medium"
                  placeholder="Mot de passe"
                />
              </div>

              {!isLogin && role === 'Commerçant' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 pt-3"
                >
                  <div className="relative group">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
                    <input
                      type="text"
                      required
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gabon-blue/20 focus:border-gabon-blue transition-all outline-none font-medium"
                      placeholder="Nom de votre boutique"
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gabon-blue/20 focus:border-gabon-blue transition-all outline-none font-medium"
                      placeholder="Numéro WhatsApp"
                    />
                  </div>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gabon-blue/20 focus:border-gabon-blue transition-all outline-none font-medium"
                      placeholder="Ville / Quartier"
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 mt-6"
            >
              {isLogin ? 'Se connecter' : 'C\'est parti'}
            </button>

            <div className="pt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-bold text-slate-500 hover:text-gabon-blue transition-colors"
              >
                {isLogin ? "Nouveau ici ? Créer un compte" : 'Déjà inscrit ? Connexion'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

