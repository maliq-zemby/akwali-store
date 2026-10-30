import React, { useState } from 'react';
import { db } from '@/src/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/src/hooks/useAuth';
import { motion } from 'motion/react';
import { 
  User, 
  Store, 
  Camera, 
  Save, 
  CheckCircle, 
  Loader2, 
  Building2, 
  Phone as PhoneIcon, 
  MapPin,
  AlertCircle,
  BadgeCheck
} from 'lucide-react';

interface ProfileSettingsProps {
  profile: UserProfile;
  onComplete: () => void;
}

import { compressImage } from '@/src/lib/image-utils';

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onComplete }) => {
  const [role, setRole] = useState<'Client' | 'Commerçant'>(profile.role);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [shopName, setShopName] = useState(profile.shopName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [city, setCity] = useState(profile.city || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        // Compress to max 400x400 for profile pics, which is plenty and very small in Base64
        const compressedBase64 = await compressImage(file, 400, 400, 0.6);
        setPhotoPreview(compressedBase64);
      } catch (err) {
        console.error("Compression error:", err);
        alert("Erreur lors de la préparation de l'image.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updatedData: any = {
        role,
        displayName,
        photoURL: photoPreview,
        ...(role === 'Commerçant' ? { shopName, phone, city } : { shopName: null, phone: null, city: null })
      };

      await updateDoc(doc(db, 'users', profile.uid), updatedData);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 md:px-0">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Mon Profil.</h2>
        <p className="text-slate-500 font-medium">Gérez vos informations personnelles et votre rôle sur la plateforme.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
              <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Photo de profil</p>
            {profile.isVerified && (
              <BadgeCheck className="h-4 w-4 text-gabon-blue" fill="currentColor" fillOpacity="0.1" />
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-8 rounded-[2rem] premium-shadow border border-slate-100 space-y-6">
          <div className="relative group">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="block w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold"
              placeholder="Votre Nom complet"
            />
          </div>
        </div>

        {/* Role Switcher */}
        <div className="bg-white p-2 rounded-2xl premium-shadow border border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => setRole('Client')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              role === 'Client' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" /> Client
          </button>
          <button
            type="button"
            onClick={() => setRole('Commerçant')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
              role === 'Commerçant' ? 'bg-gabon-blue text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Store className="h-4 w-4" /> Commerçant
          </button>
        </div>

        {/* Merchant Fields */}
        <motion.div 
          animate={{ height: role === 'Commerçant' ? 'auto' : 0, opacity: role === 'Commerçant' ? 1 : 0 }}
          className="overflow-hidden space-y-4"
        >
          <div className="bg-white p-8 rounded-[2rem] premium-shadow border border-slate-100 space-y-6">
            <div className="relative group">
              <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
              <input
                type="text"
                required={role === 'Commerçant'}
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="block w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold"
                placeholder="Nom de votre boutique"
              />
            </div>
            <div className="relative group">
              <PhoneIcon className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
              <input
                type="tel"
                required={role === 'Commerçant'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold"
                placeholder="Numéro WhatsApp"
              />
            </div>
            <div className="relative group">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-gabon-blue transition-colors" />
              <input
                type="text"
                required={role === 'Commerçant'}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="block w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none font-bold"
                placeholder="Ville / Quartier"
              />
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-600 text-sm font-bold">
            <CheckCircle className="h-5 w-5 shrink-0" />
            Profil mis à jour avec succès !
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-slate-900 text-white text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les modifications
            </>
          )}
        </button>
      </form>
    </div>
  );
};
