import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, Timestamp, where, getDocs } from 'firebase/firestore';
import { UserProfile } from '@/src/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, ShieldCheck, ArrowLeft, Search, MessageSquare, BadgeCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/src/lib/error-handler';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  chatId: string;
  createdAt: Timestamp;
}

export const Chat: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedCategory] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch users
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs
        .map(doc => doc.data() as UserProfile)
        .filter(u => u.uid !== profile.uid); // Hide self
      setUsers(allUsers);
      setLoadingUsers(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, [profile.uid]);

  // Fetch messages for selected chat
  useEffect(() => {
    if (!selectedUser) return;

    // Composite chatId to group messages between two users
    const chatId = [profile.uid, selectedUser.uid].sort().join('_');
    const path = 'messages';
    const q = query(
      collection(db, path), 
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc'), 
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [selectedUser, profile.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUser) return;

    const chatId = [profile.uid, selectedUser.uid].sort().join('_');
    const msg = {
      text: inputText,
      chatId,
      senderId: profile.uid,
      senderName: profile.shopName || profile.email.split('@')[0],
      senderRole: profile.role,
      receiverId: selectedUser.uid,
      createdAt: serverTimestamp(),
    };

    setInputText('');
    try {
      await addDoc(collection(db, 'messages'), msg);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.shopName || u.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-14rem)] flex bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden relative">
      {/* Sidebar: User List */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 space-y-4">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Communauté</h3>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-gabon-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-gabon-blue/10 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingUsers ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-2xl" />
            ))
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucun profil trouvé</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.uid}
                onClick={() => setSelectedCategory(u)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 ${
                  selectedUser?.uid === u.uid 
                    ? 'bg-white premium-shadow border border-slate-100 ring-2 ring-gabon-blue/5' 
                    : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center">
                    {u.photoURL ? (
                      <img src={u.photoURL} className="w-full h-full object-cover" alt={u.email} />
                    ) : (
                      <UserIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${u.role === 'Commerçant' ? 'bg-gabon-yellow' : 'bg-gabon-green'}`} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-black text-slate-900 truncate">
                      {u.role === 'Commerçant' ? u.shopName : u.email.split('@')[0]}
                    </p>
                    {u.isVerified && (
                      <BadgeCheck className="h-3.5 w-3.5 text-gabon-blue shrink-0" fill="currentColor" fillOpacity="0.1" />
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                    {u.role} • {u.city || 'Gabon'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-slate-200" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-900 mb-2">Votre espace de discussion</h4>
              <p className="text-sm text-slate-400 max-w-xs font-medium">Sélectionnez un membre de la communauté AKWALI pour démarrer une conversation privée.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-8 py-6 bg-slate-50/50 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-slate-200 overflow-hidden flex items-center justify-center">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} className="w-full h-full object-cover" alt="Recipient" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                      {selectedUser.role === 'Commerçant' ? selectedUser.shopName : selectedUser.email.split('@')[0]}
                    </h3>
                    {selectedUser.isVerified && (
                      <BadgeCheck className="h-4 w-4 text-gabon-blue" fill="currentColor" fillOpacity="0.1" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gabon-green animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedUser.role} • En ligne</p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex p-3 rounded-2xl bg-gabon-blue/10">
                <ShieldCheck className="h-5 w-5 text-gabon-blue" />
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
            >
              <AnimatePresence mode="popLayout">
                {messages.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Démarrage de la discussion sécurisée</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex flex-col ${msg.senderId === profile.uid ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[75%] px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed premium-shadow ${
                        msg.senderId === profile.uid 
                          ? 'bg-slate-900 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-300 font-bold mt-2 px-2">
                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-slate-50/50 backdrop-blur-md border-t border-slate-100 flex gap-4 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-6 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-gabon-blue/10 focus:border-gabon-blue transition-all outline-none text-sm font-medium"
              />
              <button
                type="submit"
                className="p-4 bg-gabon-blue text-white rounded-2xl hover:bg-gabon-blue-dark transition-all shadow-lg shadow-gabon-blue/20 hover:scale-105"
              >
                <Send className="h-6 w-6" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};


