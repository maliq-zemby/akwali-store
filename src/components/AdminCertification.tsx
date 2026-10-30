import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { UserProfile } from '@/src/hooks/useAuth';
import { motion } from 'motion/react';
import { ShieldCheck, User as UserIcon, BadgeCheck, Loader2, Search, Filter } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/src/lib/error-handler';

export const AdminCertification: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('unverified');

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(allUsers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // 1. Update User Profile
      await updateDoc(doc(db, 'users', userId), {
        isVerified: newStatus
      });
      
      // 2. Update all products by this seller (denormalization update)
      const productsQuery = query(collection(db, 'produits'), where('sellerId', '==', userId));
      const productsSnapshot = await getDocs(productsQuery);
      
      if (!productsSnapshot.empty) {
        const batch = writeBatch(db);
        productsSnapshot.docs.forEach((productDoc) => {
          batch.update(productDoc.ref, { sellerIsVerified: newStatus });
        });
        await batch.commit();
      }
      
    } catch (err) {
      console.error("Error toggling verification:", err);
      alert("Erreur lors de la certification.");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.shopName || u.displayName || u.email).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'verified' && u.isVerified) || 
                         (filter === 'unverified' && !u.isVerified);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center md:text-left">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3 justify-center md:justify-start">
          <ShieldCheck className="h-10 w-10 text-gabon-blue" />
          Certification.
        </h2>
        <p className="text-slate-500 font-medium">Gérez la certification officielle des commerçants de la plateforme.</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-gabon-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un utilisateur ou une boutique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold"
            />
          </div>
          <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
            {(['unverified', 'verified', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f === 'unverified' ? 'Non Certifiés' : f === 'verified' ? 'Certifiés' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-gabon-blue animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <motion.div
                layout
                key={u.uid}
                className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:bg-white hover:premium-shadow transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover" alt={u.displayName} />
                    ) : (
                      <UserIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-lg font-black text-slate-900">
                        {u.role === 'Commerçant' ? u.shopName : (u.displayName || u.email.split('@')[0])}
                      </p>
                      {u.isVerified && (
                        <BadgeCheck className="h-5 w-5 text-gabon-blue" fill="currentColor" fillOpacity="0.1" />
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {u.role} • {u.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleVerification(u.uid, !!u.isVerified)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    u.isVerified 
                      ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' 
                      : 'bg-gabon-blue text-white hover:bg-gabon-blue-dark shadow-lg shadow-gabon-blue/20'
                  }`}
                >
                  {u.isVerified ? 'Révoquer' : 'Certifier'}
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
