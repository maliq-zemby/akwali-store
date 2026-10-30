import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, MapPin, Store, Tag, Sparkles, Trash2, BadgeCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/src/lib/error-handler';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth } from '@/src/lib/firebase';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  mediaType?: 'image' | 'video';
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerCity: string;
  sellerIsVerified?: boolean;
  createdAt: Timestamp;
}

import { ConfirmModal } from './ConfirmModal';

export const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Support both sellerId and userId for ownership check
  const ownerId = product.sellerId || (product as any).userId;
  const isOwner = auth.currentUser?.uid === ownerId;

  const handleDelete = async () => {
    if (!product?.id) {
      alert("Erreur : L'ID de cet article est introuvable.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "produits", product.id));
      // No alert needed for success if we have real-time sync, but let's keep the UI responsive
    } catch (error: any) {
      console.error("Erreur de suppression :", error);
      alert("Erreur lors de la suppression : " + error.message);
      handleFirestoreError(error, OperationType.DELETE, `produits/${product.id}`);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const openConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8 }}
      className="group bg-white rounded-[2rem] overflow-hidden premium-shadow border border-slate-100 flex flex-col h-full transition-all duration-500 relative"
    >
      <ConfirmModal
        isOpen={showConfirm}
        title="Supprimer l'article ?"
        message={`Voulez-vous vraiment supprimer "${product.title}" ? Cette action est irréversible.`}
        confirmLabel={isDeleting ? "Suppression..." : "Supprimer"}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        isDestructive={true}
      />

      {/* Delete Button for Owners */}
      {isOwner && (
        <button
          onClick={openConfirm}
          className="absolute top-4 left-4 z-20 p-3 bg-red-500 text-white rounded-2xl shadow-lg md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600 active:scale-95"
          title="Supprimer l'article"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
        {product.mediaType === 'video' ? (
          <video 
            src={product.imageUrl} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            muted
            loop
            onMouseOver={e => e.currentTarget.play()}
            onMouseOut={e => e.currentTarget.pause()}
            playsInline
          />
        ) : (
          <img 
            src={product.imageUrl || '/images/product_clothing_1793308826719.jpg'} 
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        )}
        <div className="absolute top-4 right-4 glass px-4 py-2 rounded-2xl shadow-sm z-10">
          <span className="text-sm font-black text-gabon-blue tabular-nums">
            {product.price.toLocaleString()} <span className="text-[10px] ml-0.5">FCFA</span>
          </span>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4 glass px-3 py-1.5 rounded-xl shadow-sm z-10">
          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest italic">
            {product.category}
          </span>
        </div>
        
        {/* Quick Contact Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
          <a 
            href={`https://wa.me/${product.sellerPhone.replace(/\s+/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-white text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500"
          >
            <Phone className="h-4 w-4" /> Acheter
          </a>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {product.sellerCity}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-gabon-blue transition-colors leading-tight line-clamp-1">
            {product.title}
          </h3>
        </div>
        
        <p className="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed flex-1">
          {product.description}
        </p>
        
        <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Store className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-slate-900">{product.sellerName}</span>
              {product.sellerIsVerified && (
                <BadgeCheck className="h-3.5 w-3.5 text-gabon-blue" fill="currentColor" fillOpacity="0.1" />
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Vendeur vérifié</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

import { Search, Filter } from 'lucide-react';

export const ProductList: React.FC<{ merchantId?: string }> = ({ merchantId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');

  const categories = ["Tous", "Immobilier", "Véhicules", "Vêtements", "Chaussures", "Appareils", "Autres"];

  useEffect(() => {
    const path = 'produits';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(product => {
    const ownerId = product.sellerId || (product as any).userId;
    const matchesMerchant = !merchantId || ownerId === merchantId;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;
    return matchesMerchant && matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-12 md:space-y-20 pb-20">
      {/* Hero Section - Only on Home */}
      {!merchantId && (
        <section className="relative h-[400px] md:h-[600px] rounded-[2rem] md:rounded-[3rem] overflow-hidden premium-shadow">
          <img 
            src="/images/hero_marketplace_1793308827106.jpg" 
            className="absolute inset-0 w-full h-full object-cover"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex items-center px-6 md:px-24">
            <div className="max-w-xl text-white">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 md:mb-8"
              >
                <Sparkles className="h-3 w-3 text-gabon-yellow" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white">Marketplace Officielle du Gabon</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-7xl font-black tracking-tight mb-6 md:mb-8 leading-[0.95]"
              >
                L'ART DE <span className="text-gabon-yellow">VENDRE</span> AU GABON.
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative max-w-md group mb-8 md:mb-12"
              >
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-gabon-blue transition-colors" />
                <input 
                  type="text"
                  placeholder="Que recherchez-vous ?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 md:py-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] md:rounded-[2rem] text-white placeholder:text-white/40 focus:bg-white focus:text-slate-900 focus:ring-4 focus:ring-gabon-blue/20 outline-none transition-all font-bold"
                />
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Dashboard Header */}
      {merchantId && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-md">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Ma Boutique.</h2>
            <p className="text-slate-500 font-medium">Gérez vos articles et suivez vos ventes en temps réel.</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-3xl premium-shadow border border-slate-50">
            <div className="px-6 py-4 bg-slate-50 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest">
              {filteredProducts.length} Articles en ligne
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-12">
        {!merchantId && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">Découvrir.</h2>
                <p className="text-slate-500 font-medium">Filtrez par catégorie pour trouver exactement ce dont vous avez besoin.</p>
              </div>
              
              <div className="flex items-center gap-4 bg-white p-2 rounded-3xl premium-shadow border border-slate-50">
                <div className="px-6 py-4 bg-slate-50 rounded-2xl text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  {filteredProducts.length} Articles
                </div>
                <div className="px-6 py-4 bg-gabon-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  Ventes en direct
                </div>
              </div>
            </div>

            {/* Categories Filter Bar */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border-2 ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="bg-slate-100 animate-pulse aspect-[4/5] rounded-[2rem]" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? <Search className="h-8 w-8 text-slate-200" /> : <Tag className="h-8 w-8 text-slate-200" />}
            </div>
            <p className="text-xl font-bold text-slate-400">Aucun article trouvé.</p>
            <p className="text-sm text-slate-300 mt-2">
              {searchQuery ? "Essayez d'autres mots-clés." : "Soyez le premier à publier dans cette catégorie !"}
            </p>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

