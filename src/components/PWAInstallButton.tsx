import React, { useState } from 'react';
import { usePWAInstall } from '@/src/hooks/usePWAInstall';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black text-white shadow-xl hover:bg-black transition-all uppercase tracking-widest"
      >
        <Download className="w-5 h-5 text-gabon-yellow" />
        Installer l'app
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-[#3A75C4] px-4 py-2 text-xs font-black text-[#3A75C4] hover:bg-[#3A75C4] hover:text-white transition-all uppercase tracking-wider"
        >
          <PlusSquare className="w-4 h-4" />
          Ajouter à l'écran
        </button>

        <AnimatePresence>
          {showIOSGuide && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowIOSGuide(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <h3 className="text-xl font-black text-gray-900 pr-8">Installer sur iOS</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-2xl">
                      <Share className="h-6 w-6 text-[#3A75C4]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Étape 1</p>
                      <p className="text-xs text-gray-500 mt-1">Appuyez sur le bouton 'Partager' dans la barre d'outils Safari.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-2xl">
                      <PlusSquare className="h-6 w-6 text-[#009E60]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Étape 2</p>
                      <p className="text-xs text-gray-500 mt-1">Faites défiler vers le bas et appuyez sur 'Sur l'écran d'accueil'.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="mt-8 w-full rounded-2xl bg-gray-900 py-4 text-sm font-black text-white hover:bg-black transition-all"
                >
                  Compris
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
};
