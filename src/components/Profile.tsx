import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { LogOut, User as UserIcon, Award, Clock, Shield, Zap, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProfileProps {
  user: User;
}

interface UserStats {
  points: number;
  reports: number;
  rank: string;
}

interface PriceReport {
  id: string;
  stationName: string;
  price: number;
  fuelType: string;
  updatedAt: Timestamp;
}

export default function Profile({ user }: ProfileProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setStats(userDoc.data() as UserStats);
        }

        const q = query(
          collection(db, 'prices'),
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        const fetchedReports = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as PriceReport[];
        setReports(fetchedReports);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfileData();
  }, [user.uid]);

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center px-1">
        <h1 className="text-4xl font-black tracking-tighter text-white">PROFIL</h1>
        <button onClick={() => signOut(auth)} className="w-10 h-10 glass-card !rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors">
          <LogOut size={18} />
        </button>
      </header>

      {/* User Card */}
      <div className="glass-card p-10 flex flex-col items-center text-center relative group">
        <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 flex items-center justify-center text-white mb-6 border border-white/5 shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform">
          <UserIcon size={40} />
        </div>
        <h2 className="text-2xl font-black tracking-tight uppercase">{user.displayName || 'Telemetri-användare'}</h2>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 italic">{user.email}</p>
        
        <div className="flex gap-4 mt-8">
           <div className="px-5 py-2 glass-card !rounded-2xl border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Poäng</span>
              <span className="text-xl font-black text-white">{stats?.points || 0}</span>
           </div>
           <div className="px-5 py-2 glass-card !rounded-2xl border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">Rank</span>
              <span className="text-xl font-black text-emerald-500">{stats?.rank || 'ROOKIE'}</span>
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 flex flex-col items-center text-center gap-3">
           <Award className="text-amber-500" size={24} />
           <div className="text-2xl font-black italic">{stats?.reports || 0}</div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Rapporter</span>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center gap-3">
           <Shield className="text-blue-500" size={24} />
           <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2 italic">Standard</div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Säkerhetsnivå</span>
        </div>
      </div>

      {/* Activity Log */}
      <section className="space-y-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-500 px-1 italic">Loggbok</h3>
        <div className="space-y-4">
          {loading ? (
             [1,2].map(i => <div key={i} className="h-20 glass-card animate-pulse" />)
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <motion.div 
                key={report.id}
                whileHover={{ x: 5 }}
                className="glass-card p-5 flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight text-white">{report.stationName}</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">
                      {report.updatedAt.toDate().toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-white italic">{report.price.toFixed(2)}</span>
                  <p className="text-[9px] font-black uppercase text-zinc-500">KR</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-card p-10 text-center border-dashed">
              <Zap className="mx-auto text-zinc-800 mb-4" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Ingen loggad aktivitet</p>
            </div>
          )}
        </div>
      </section>

      {/* Secondary Actions */}
      <div className="space-y-3 pt-4">
         <button className="w-full glass-card p-5 flex items-center justify-between hover:bg-zinc-800/50 group">
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Sekretess & Data</span>
            <ChevronRight size={16} className="text-zinc-700" />
         </button>
         <button className="w-full glass-card p-5 flex items-center justify-between hover:bg-zinc-800/50 group">
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">App-inställningar</span>
            <ChevronRight size={16} className="text-zinc-700" />
         </button>
      </div>
    </div>
  );
}
