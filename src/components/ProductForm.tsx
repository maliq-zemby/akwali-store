import React, { useState } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/src/hooks/useAuth';
import { motion } from 'motion/react';
import { Package, Image as ImageIcon, CheckCircle, Upload, X, FileVideo, Store } from 'lucide-react';

import { compressImage } from '@/src/lib/image-utils';

export const ProductForm: React.FC<{ profile: UserProfile; onComplete: () => void }> = ({ profile, onComplete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [mediaBase64, setMediaBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = ["Immobilier", "Véhicules", "Vêtements", "Chaussures", "Appareils", "Autres"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video') && file.size > 1 * 1024 * 1024) {
        alert("La vidéo est trop lourde (max 1Mo pour le stockage direct).");
        return;
      }
      
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file, 1024, 1024, 0.7);
        setMediaBase64(compressedBase64);
        setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      } catch (err) {
        console.error("Compression error:", err);
        alert("Erreur lors de la préparation du fichier.");
      } finally {
        setLoading(false);
      }
    }
  };

  const removeMedia = () => {
    setMediaBase64(null);
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaBase64) {
      alert('Veuillez sélectionner une image ou une vidéo.');
      return;
    }
    if (!category) {
      alert('Veuillez choisir une catégorie.');
      return;
    }

    setLoading(true);
    try {
      // Save product to Firestore with the Base64 data
      await addDoc(collection(db, 'produits'), {
        title,
        description,
        category,
        price: Number(price),
        imageUrl: mediaBase64, // Still calling it imageUrl for compatibility
        mediaType: mediaType,
        sellerId: profile.uid,
        sellerName: profile.shopName || profile.email.split('@')[0],
        sellerPhone: profile.phone || '',
        sellerCity: profile.city || '',
        sellerIsVerified: !!profile.isVerified,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err: any) {
      console.error("Erreur complète :", err);
      alert("Erreur : " + (err?.message || "Une erreur est survenue lors de l'enregistrement"));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="p-4 rounded-full bg-gabon-green bg-opacity-10 mb-4">
          <CheckCircle className="h-12 w-12 text-gabon-green" />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Publié avec succès !</h3>
        <p className="text-slate-500 mt-2">Votre article est maintenant en ligne pour tout le monde.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 md:px-0">
      <div className="mb-16 text-center md:text-left">
        <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Mettre en vente.</h2>
        <p className="text-lg text-slate-500 font-medium max-w-2xl">Partagez votre produit avec la communauté AKWALI et commencez à vendre dès maintenant à travers tout le Gabon.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Side: Media Upload */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] premium-shadow border border-slate-100 h-full flex flex-col min-h-[500px]">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Visuel du produit</label>
            <div className="flex-1">
              {!mediaBase64 ? (
                <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 hover:border-gabon-blue transition-all group min-h-[300px]">
                  <div className="flex flex-col items-center justify-center p-10 text-center">
                    <div className="p-6 bg-slate-50 rounded-[1.5rem] mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-12 h-12 text-slate-300 group-hover:text-gabon-blue" />
                    </div>
                    <p className="text-xl font-black text-slate-900 mb-2">
                      Sélectionnez un fichier
                    </p>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Images ou Vidéos haute définition<br/>jusqu'à 1 Mo (Stockage direct).
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              ) : (
                <div className="relative w-full h-full min-h-[400px] rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner group">
                  {mediaType === 'video' ? (
                    <video 
                      src={mediaBase64} 
                      className="w-full h-full object-cover" 
                      controls 
                    />
                  ) : (
                    <img 
                      src={mediaBase64} 
                      className="w-full h-full object-cover" 
                      alt="Preview"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-6 right-6 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Details */}
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[2.5rem] premium-shadow border border-slate-100 space-y-8">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Détails de l'article</label>
            
            <div className="space-y-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-black text-xl placeholder:text-slate-300"
                placeholder="Titre de l'article"
              />
            </div>

            <div className="space-y-2">
              <textarea
                required
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-medium text-base resize-none placeholder:text-slate-300 leading-relaxed"
                placeholder="Décrivez votre article avec précision (état, taille, caractéristiques)..."
              />
            </div>

            <div className="space-y-2">
              <select
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="block w-full px-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold text-lg appearance-none"
              >
                <option value="" disabled>Choisir une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <div className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 group-focus-within:text-gabon-blue text-lg">FCFA</div>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="block w-full pl-24 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-black text-2xl tabular-nums placeholder:text-slate-300"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gabon-blue opacity-10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-20 transition-opacity" />
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <Store className="h-8 w-8 text-gabon-yellow" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-widest text-[10px] text-white/50">Profil de Vente</h4>
                <p className="text-lg font-black text-white">{profile.shopName}</p>
              </div>
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-medium">
              En publiant cet article, vous confirmez que les informations sont exactes. Vos coordonnées (téléphone et ville) seront visibles par les clients pour faciliter la transaction.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-8 px-8 border border-transparent text-sm font-black uppercase tracking-widest rounded-[2rem] text-white bg-gabon-green hover:bg-gabon-green-light focus:outline-none focus:ring-4 focus:ring-gabon-green/20 transition-all disabled:opacity-50 shadow-2xl shadow-gabon-green/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Publication en cours...' : 'Confirmer la mise en ligne'}
          </button>
        </div>
      </form>
    </div>
  );
};
