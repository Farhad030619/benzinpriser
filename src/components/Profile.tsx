import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { FuelLog } from '../types';
import { signOut, type User } from 'firebase/auth';
import { LogOut, Trash2, Fuel, Plus, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileProps {
  user: User;
  isDark: boolean;
  toggleTheme: () => void;
}

export default function Profile({ user, isDark, toggleTheme }: ProfileProps) {
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
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-3xl font-black text-[var(--text-main)] tracking-tight">Din Profil</motion.h1>
        
        {/* User menu button */}
        <div ref={menuRef} className="relative">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-10 h-10 bg-[var(--bg-card)] rounded-2xl shadow-soft flex items-center justify-center text-[var(--text-muted)] hover:text-brand-orange transition-colors"
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
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Inloggad som</p>
                  <p className="text-sm font-bold text-[var(--text-main)] truncate">{user.email}</p>
                </div>
                <div className="border-t border-[var(--bg-secondary)] pt-2">
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
          <div className="w-8 h-8 rounded-xl bg-brand-orange/10 flex items-center justify-center text-brand-orange"><Plus size={18} strokeWidth={3} /></div>
          <h3 className="font-black text-lg text-[var(--text-main)] tracking-tight">Logga tankning</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Belopp (kr)</label>
            <input type="number" min="0" step="0.01" value={sek} onChange={(e) => setSek(e.target.value)} className="input-field" placeholder="800" required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Volym (lit)</label>
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

      {/* Settings / Dark Mode */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="glass-card p-6 mb-8 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-main)]">
            {isDark ? (
              <motion.div initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              </motion.div>
            )}
          </div>
          <div>
            <h3 className="font-black text-sm text-[var(--text-main)] tracking-tight">Mörkt läge</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{isDark ? 'Aktivt' : 'Inaktivt'}</p>
          </div>
        </div>
        
        <button 
          onClick={toggleTheme}
          className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ${isDark ? 'bg-brand-orange' : 'bg-[var(--bg-secondary)]'}`}
        >
          <motion.div 
            animate={{ x: isDark ? 24 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
          >
            {isDark ? (
              <div className="w-1 h-1 bg-brand-orange rounded-full" />
            ) : (
              <div className="w-1 h-1 bg-[var(--text-muted)] rounded-full" />
            )}
          </motion.div>
        </button>
      </motion.div>

      {/* List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest px-2 mb-2">Tankningshistorik</h2>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {logs.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[var(--text-muted)] text-sm font-bold text-center py-10 glass-card border-dashed">
                Inga tankningar än.
              </motion.p>
            ) : (
              logs.map((log) => (
                <motion.div 
                  layout key={log.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="glass-card p-5 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]"><Fuel size={18} /></div>
                    <div>
                      <h4 className="font-black text-[var(--text-main)] tracking-tight">{log.date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}</h4>
                      <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{log.lit} liter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-[var(--text-main)] tracking-tighter">{log.sek}<span className="text-[10px] ml-0.5 text-[var(--text-muted)] uppercase tracking-normal">kr</span></span>
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

      {/* Confirmation Dialog - Fixed Performance */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative glass-card p-8 max-w-sm w-full text-center shadow-2xl border-[var(--border-main)]"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 tracking-tight">Radera?</h3>
              <p className="text-[var(--text-muted)] font-medium mb-8">Denna tankning försvinner för alltid. Är du helt säker?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 btn-secondary py-4"
                >
                  Avbryt
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 btn-danger py-4"
                >
                  Radera
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
