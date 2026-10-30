import React from 'react';
import { useOnlineStatus } from '@/src/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 md:bottom-10 left-6 right-6 md:left-auto md:right-10 z-[60] flex items-center gap-4 rounded-3xl bg-slate-900 p-5 text-sm font-bold text-white shadow-2xl border border-white/10 backdrop-blur-xl"
        >
          <div className="p-3 bg-gabon-yellow rounded-2xl">
            <WifiOff className="h-6 w-6 text-slate-900 animate-pulse" />
          </div>
          <div>
            <p className="text-base">Connexion perdue</p>
            <p className="text-[11px] opacity-60 font-medium leading-tight">Vérifiez votre accès internet pour synchroniser.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
