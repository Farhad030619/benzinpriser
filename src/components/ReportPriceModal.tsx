import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Station } from '../types';

interface ReportPriceModalProps {
  station: Station;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportPriceModal({ station, onClose, onSuccess }: ReportPriceModalProps) {
  const [price, setPrice] = useState(station.price.toString());
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(price.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      alert('Ange ett giltigt pris.');
      return;
    }

    setLoading(true);
    try {
      const priceDocId = `${station.id}_${station.fuelType}`;
      await setDoc(doc(db, 'prices', priceDocId), {
        stationId: station.id,
        fuelType: station.fuelType,
        price: val,
        updatedAt: serverTimestamp(),
        reportedBy: auth.currentUser?.uid
      });
      
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error reporting price:', error);
      alert('Kunde inte spara priset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-32">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-sm p-8 relative z-10"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }}>
              <h2 className="text-xl font-black mb-1 text-zinc-900 tracking-tight">Rapportera pris</h2>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">{station.name}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Aktuellt pris för {station.fuelType}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input-field text-2xl font-black pr-12"
                      autoFocus
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-black">kr</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading}
                  className="w-full btn-primary"
                >
                  {loading ? 'Sparar...' : 'Bekräfta pris'}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-xl font-black text-zinc-900">Tack för hjälpen!</h3>
              <p className="text-zinc-500 font-medium text-sm mt-1">Priset har uppdaterats för alla.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
