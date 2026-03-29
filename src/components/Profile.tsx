import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { FuelLog } from '../types';
import { signOut, type User } from 'firebase/auth';
import { LogOut, Trash2, Fuel, Plus, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile({ user }: { user: User }) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [sek, setSek] = useState('');
  const [lit, setLit] = useState('');
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const q = collection(db, 'users', user.uid, 'logs');
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as FuelLog[];
      setLogs(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
    });
    return unsub;
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const valSek = parseFloat(sek);
    const valLit = parseFloat(lit);
    
    if (!sek || !lit || valSek < 0 || valLit < 0) {
      alert('Vänligen ange giltiga positiva värden.');
      return;
    }
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'logs'), {
        sek: valSek,
        lit: valLit,
        date: new Date()
      });
      setSek(''); setLit('');
    } catch (error: any) {
      console.error('Error saving refill:', error);
      alert(error.code === 'permission-denied' 
        ? 'Rättighet saknas! Du måste uppdatera dina Firestore Rules i Firebase Console.' 
        : 'Kunde inte spara din tankning. Prova igen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'logs', confirmDeleteId));
    } catch (e) {
      alert('Kunde inte ta bort.');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const totalSek = logs.reduce((sum, log) => sum + log.sek, 0);
  const totalLit = logs.reduce((sum, log) => sum + log.lit, 0);

  return (
    <div className="pt-2">
      <header className="flex justify-between items-center mb-8 relative">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-black text-zinc-900 tracking-tight">Din Profil</motion.h1>
        
        {/* User menu button */}
        <div ref={menuRef} className="relative">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 bg-white rounded-2xl shadow-soft flex items-center justify-center text-zinc-500 hover:text-brand-orange transition-colors"
          >
            <UserIcon size={20} />
          </motion.button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                className="absolute right-0 top-12 w-56 glass-card p-3 z-50 shadow-xl"
              >
                <div className="px-3 py-2 mb-2">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Inloggad som</p>
                  <p className="text-sm font-bold text-zinc-800 truncate">{user.email}</p>
                </div>
                <div className="border-t border-zinc-100 pt-2">
                  <button
                    onClick={() => signOut(auth)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Logga ut
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Stats Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-brand-orange text-white p-7 mb-8 shadow-brand border-none relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-20"><Fuel size={80} /></div>
        <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Totalt (Månad)</h3>
        <motion.div 
          key={totalSek}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-black mb-1 tracking-tighter"
        >
          {totalSek.toLocaleString('sv-SE')} <span className="text-lg opacity-80">kr</span>
        </motion.div>
        <div className="text-sm font-bold opacity-80">{totalLit.toFixed(1)} liter tankat</div>
      </motion.div>

      {/* Form */}
      <motion.form 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onSubmit={handleSave} className="glass-card p-6 mb-10"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-brand-orange"><Plus size={18} strokeWidth={3} /></div>
          <h3 className="font-black text-lg text-zinc-800 tracking-tight">Logga tankning</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Belopp (kr)</label>
            <input type="number" min="0" step="0.01" value={sek} onChange={(e) => setSek(e.target.value)} className="input-field" placeholder="800" required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Volym (lit)</label>
            <input type="number" min="0" step="0.01" value={lit} onChange={(e) => setLit(e.target.value)} className="input-field" placeholder="40" required />
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading}
          className="w-full btn-primary"
        >
          {loading ? 'Sparar...' : 'Spara i historik'}
        </motion.button>
      </motion.form>

      {/* List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-zinc-400 uppercase tracking-widest px-2 mb-2">Tankningshistorik</h2>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {logs.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-zinc-400 text-sm font-bold text-center py-10 glass-card border-dashed">
                Inga tankningar än.
              </motion.p>
            ) : (
              logs.map((log) => (
                <motion.div 
                  layout key={log.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="glass-card p-5 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400"><Fuel size={18} /></div>
                    <div>
                      <h4 className="font-black text-zinc-900 tracking-tight">{log.date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</h4>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{log.lit} liter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-zinc-900 tracking-tighter">{log.sek}<span className="text-[10px] ml-0.5 text-zinc-400 uppercase tracking-normal">kr</span></span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(log.id)}
                      className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-sm w-full text-center"
            >
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-zinc-900 mb-2">Bekräfta borttagning</h3>
              <p className="text-zinc-600 mb-6">Är du säker på att du vill ta bort denna tankning? Denna åtgärd kan inte ångras.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 btn-secondary"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 btn-danger"
                >
                  Ta bort
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
