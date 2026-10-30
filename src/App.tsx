import { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { Auth } from '@/src/components/Auth';
import { Navbar } from '@/src/components/Navbar';
import { ProductList } from '@/src/components/ProductList';
import { ProductForm } from '@/src/components/ProductForm';
import { Chat } from '@/src/components/Chat';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineIndicator } from '@/src/components/OfflineIndicator';
import { PWAInstallButton } from '@/src/components/PWAInstallButton';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'chat' | 'publish'>('home');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#3A75C4] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">AKWALI STORE</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Auth onAuth={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 md:pb-12">
      <Navbar profile={profile} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-10 flex justify-end">
          <PWAInstallButton />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProductList />
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <Chat profile={profile} />
            </motion.div>
          )}

          {activeTab === 'publish' && profile.role === 'Commerçant' && (
            <motion.div
              key="publish"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProductForm profile={profile} onComplete={() => setActiveTab('home')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <OfflineIndicator />
      
      {/* Gabon Flag Accent */}
      <div className="fixed bottom-0 left-0 w-full h-1 hidden md:flex">
        <div className="flex-1 bg-[#009E60]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#3A75C4]" />
      </div>
    </div>
  );
}

