import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, limit, Timestamp } from 'firebase/firestore';
import { UserProfile } from '@/src/hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User as UserIcon, ShieldCheck } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: Timestamp;
}

import { handleFirestoreError, OperationType } from '@/src/lib/error-handler';

export const Chat: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = 'messages';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const msg = {
      text: inputText,
      senderId: profile.uid,
      senderName: profile.shopName || profile.email.split('@')[0],
      senderRole: profile.role,
      createdAt: serverTimestamp(),
    };

    setInputText('');
    try {
      await addDoc(collection(db, 'messages'), msg);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-14rem)] flex flex-col bg-white rounded-[2.5rem] premium-shadow border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 bg-slate-50/50 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gabon-blue/10">
            <ShieldCheck className="h-6 w-6 text-gabon-blue" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Chat Communautaire</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-gabon-green animate-pulse" />
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">En Direct</p>
            </div>
          </div>
        </div>
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-10 h-10 rounded-xl border-4 border-white bg-slate-100 flex items-center justify-center text-slate-400">
              <UserIcon className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col ${msg.senderId === profile.uid ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${msg.senderId === profile.uid ? 'text-gabon-blue' : 'text-slate-400'}`}>
                  {msg.senderName}
                </span>
                <span className="text-[9px] text-slate-300 font-bold">
                  {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`max-w-[75%] px-6 py-4 rounded-[2rem] text-sm font-medium leading-relaxed premium-shadow ${
                msg.senderId === profile.uid 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
    </div>
  );
};

