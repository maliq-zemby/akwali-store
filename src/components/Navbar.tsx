import React from 'react';
import { ShoppingBag, LogOut, MessageCircle, User, PlusCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import { notifyEvent } from '@/src/lib/notifications';
import { UserProfile } from '@/src/hooks/useAuth';

interface NavbarProps {
  profile: UserProfile | null;
  activeTab: 'home' | 'chat' | 'publish';
  setActiveTab: (tab: 'home' | 'chat' | 'publish') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ profile, activeTab, setActiveTab }) => {
  const handleSignOut = async () => {
    const email = auth.currentUser?.email || '';
    await signOut(auth);
    await notifyEvent('LOGOUT', email);
  };

  return (
    <header className="sticky top-4 z-50 px-4 md:px-8">
      <div className="max-w-7xl mx-auto glass rounded-2xl premium-shadow h-20 px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Brand */}
        <div 
          className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group"
          onClick={() => setActiveTab('home')}
        >
          <div className="p-2 rounded-xl bg-gabon-green transform group-hover:scale-105 transition-transform duration-300">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            AKWALI<span className="text-gabon-blue"> STORE</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { id: 'home', label: 'Marché' },
            { id: 'chat', label: 'Communauté' },
            ...(profile?.role === 'Commerçant' ? [{ id: 'publish', label: 'Vendre' }] : []),
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id as any)}
              className={`text-sm font-bold tracking-wide uppercase transition-all duration-300 relative py-1 ${
                activeTab === link.id 
                  ? 'text-gabon-blue' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {link.label}
              {activeTab === link.id && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gabon-blue rounded-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900">
              {profile?.role === 'Commerçant' ? profile.shopName : profile?.email.split('@')[0]}
            </span>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mt-0.5">
              {profile?.role}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
            title="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 glass rounded-2xl premium-shadow flex justify-around items-center px-4 z-50">
        {[
          { id: 'home', icon: ShoppingBag, label: 'Marché' },
          { id: 'chat', icon: MessageCircle, label: 'Chat' },
          ...(profile?.role === 'Commerçant' ? [{ id: 'publish', icon: PlusCircle, label: 'Vendre' }] : []),
        ].map((link) => (
          <button 
            key={link.id}
            onClick={() => setActiveTab(link.id as any)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === link.id ? 'text-gabon-blue scale-110' : 'text-slate-400'
            }`}
          >
            <link.icon className="h-6 w-6" />
            <span className="text-[9px] font-black uppercase tracking-tighter">{link.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

