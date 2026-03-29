import React, { useState } from 'react';
import { X, Check, Loader2, Zap, Fuel as FuelIcon } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import type { Station, FuelType } from '../types';
import { motion } from 'framer-motion';

interface ReportPriceModalProps {
  station: Station;
  onClose: () => void;
  onSuccess: () => void;
}

const fuelNames: Record<FuelType, string> = {
  bensin: 'Bensin 95',
  diesel: 'Diesel',
  gas: 'Fordonsgas',
  bensin98: 'Bensin 98'
};

const fuelColors: Record<FuelType, string> = {
  bensin: 'text-amber-400 border-amber-500/20 shadow-neon-amber',
  diesel: 'text-sky-400 border-sky-500/20 shadow-neon-blue',
  gas: 'text-emerald-400 border-emerald-500/20 shadow-neon-emerald',
  bensin98: 'text-rose-400 border-rose-500/20 shadow-neon-rose'
};

export default function ReportPriceModal({ station, onClose, onSuccess }: ReportPriceModalProps) {
  const [price, setPrice] = useState(station.price.toString());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'prices'), {
        stationId: station.id,
        stationName: station.name,
        price: parseFloat(price),
        fuelType: station.fuelType,
        userId: auth.currentUser.uid,
        updatedAt: Timestamp.now(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm glass-card p-10 border-white/5 relative shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
      >
        <button onClick={onClose} className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center mb-10">
           <div className={`w-16 h-16 rounded-[1.5rem] bg-zinc-900 mx-auto mb-6 flex items-center justify-center border border-white/5 ${fuelColors[station.fuelType as FuelType]}`}>
              <FuelIcon size={32} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 italic">Data-inskick</p>
           <h2 className="text-2xl font-black tracking-tight uppercase leading-none">{station.name}</h2>
           <p className="text-[11px] font-bold text-zinc-600 mt-2 truncate px-4">{station.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
           <div>
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Aktuellt Pris ({fuelNames[station.fuelType as FuelType]})</span>
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">SEK/Lit</span>
              </div>
              <div className="relative">
                 <input 
                   type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                   className="w-full bg-zinc-950/50 border border-white/5 rounded-3xl p-8 text-center text-5xl font-black tracking-tighter focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-white placeholder-zinc-800"
                   required
                 />
              </div>
           </div>

           <button 
             type="submit" disabled={loading || success}
             className={`w-full h-20 rounded-[2.5rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${
               success ? 'bg-emerald-500 text-white' : 'bg-white text-zinc-950 hover:scale-105 active:scale-95'
             }`}
           >
             {loading ? <Loader2 className="animate-spin" size={24} /> : success ? <Check size={24} /> : (
               <>
                 <span>Uppdatera</span>
                 <Zap size={18} fill="currentColor" />
               </>
             )}
           </button>
          </form>
        </motion.div>
    </motion.div>
  );
}
