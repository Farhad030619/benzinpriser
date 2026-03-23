import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import type { FuelLog } from '../types';
import { signOut, type User } from 'firebase/auth';
import { LogOut, Trash2 } from 'lucide-react';

export default function Profile({ user }: { user: User }) {
  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [sek, setSek] = useState('');
  const [lit, setLit] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'users', user.uid, 'logs')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as FuelLog[];
      
      // Sort in memory to avoid Firebase Index requirement
      data.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setLogs(data);
    });

    return unsub;
  }, [user.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sek || !lit) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'logs'), {
        sek: parseFloat(sek),
        lit: parseFloat(lit),
        date: new Date()
      });
      setSek('');
      setLit('');
    } catch (error) {
      alert('Kunde inte spara tankning.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Säker på att du vill ta bort?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'logs', id));
    } catch (e) {
      alert('Kunde inte ta bort.');
    }
  };

  const totalSek = logs.reduce((sum, log) => sum + log.sek, 0);
  const totalLit = logs.reduce((sum, log) => sum + log.lit, 0);

  return (
    <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Din Profil</h1>
        <button 
          onClick={() => signOut(auth)}
          className="text-zinc-400 hover:text-red-500 transition-colors p-2"
          title="Logga ut"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Budget Card */}
      <div className="glass-card bg-gradient-to-br from-brand-orange to-[#E06741] text-white p-6 mb-6">
        <h3 className="text-sm font-semibold opacity-90 mb-2">Totalt (Månad)</h3>
        <div className="text-4xl font-black mb-1">{totalSek.toLocaleString('sv-SE')} kr</div>
        <div className="text-sm font-medium opacity-90">{totalLit.toFixed(1)} liter tankat</div>
      </div>

      {/* Add Log Form */}
      <form onSubmit={handleSave} className="glass-card p-6 mb-8 border border-zinc-100">
        <h3 className="font-bold text-lg mb-4 text-zinc-800">Logga tankning</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-500 mb-1">Belopp (kr)</label>
            <input
              type="number"
              value={sek}
              onChange={(e) => setSek(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all font-medium"
              placeholder="T.ex. 800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-500 mb-1">Volym (liter)</label>
            <input
              type="number"
              value={lit}
              onChange={(e) => setLit(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all font-medium"
              placeholder="T.ex. 40"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white font-bold py-3.5 rounded-xl shadow-soft hover:bg-zinc-800 transition-colors disabled:opacity-70 mt-2"
          >
            {loading ? 'Sparar...' : 'Spara tankning'}
          </button>
        </div>
      </form>

      {/* History List */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Tankningshistorik</h2>
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              Inga tankningar inlagda än.
            </p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="glass-card p-4 flex justify-between items-center bg-white group hover:border-brand-orange/30 transition-all">
                <div>
                  <h4 className="font-bold text-zinc-800">{log.date.toLocaleDateString('sv-SE')}</h4>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">{log.lit} liter</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-brand-orange">{log.sek} kr</span>
                  <button 
                    onClick={() => handleDelete(log.id)}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-2 -mr-2 bg-red-50/0 hover:bg-red-50 rounded-lg"
                    title="Radera tankning"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
