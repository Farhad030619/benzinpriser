import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import VerifyEmail from './components/VerifyEmail';
import { MapPin, UserIcon, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      setRefreshKey(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 gap-4">
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="relative"
        >
          <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full scale-150" />
          <Zap className="w-12 h-12 text-white relative z-10" />
        </motion.div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 animate-pulse">Initierar Bensinpris</span>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.emailVerified) {
    return <VerifyEmail key={refreshKey} user={user} onRefresh={refreshUser} />;
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 selection:bg-white/20 text-white">
      {/* Background Decorative Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[50%] bg-gradient-to-t from-zinc-900/20 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="relative z-10 max-w-lg mx-auto p-6 pb-40"
        >
          {activeTab === 'home' ? <Dashboard /> : <Profile user={user} />}
        </motion.main>
      </AnimatePresence>

      {/* Premium Bottom Nav */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm bg-zinc-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2.5 flex justify-around items-center z-50 border border-white/5">
        <button
          onClick={() => setActiveTab('home')}
          className="relative flex-1 flex flex-col items-center py-4 rounded-full transition-all duration-500 group"
        >
          <AnimatePresence>
            {activeTab === 'home' && (
              <motion.div 
                layoutId="nav-bg"
                className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </AnimatePresence>
          <MapPin 
            size={18} 
            strokeWidth={activeTab === 'home' ? 2.5 : 2}
            className={`relative z-10 transition-all duration-300 ${
              activeTab === 'home' ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'
            }`} 
          />
          <span className={`relative z-10 text-[8px] font-black mt-1.5 uppercase tracking-[0.2em] transition-all duration-300 ${
            activeTab === 'home' ? 'text-black opacity-100' : 'text-zinc-500 opacity-0 group-hover:opacity-40'
          }`}>
            Karta
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="relative flex-1 flex flex-col items-center py-4 rounded-full transition-all duration-500 group"
        >
          <AnimatePresence>
            {activeTab === 'profile' && (
              <motion.div 
                layoutId="nav-bg"
                className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </AnimatePresence>
          <UserIcon 
            size={18} 
            strokeWidth={activeTab === 'profile' ? 2.5 : 2}
            className={`relative z-10 transition-all duration-300 ${
              activeTab === 'profile' ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'
            }`} 
          />
          <span className={`relative z-10 text-[8px] font-black mt-1.5 uppercase tracking-[0.2em] transition-all duration-300 ${
            activeTab === 'profile' ? 'text-black opacity-100' : 'text-zinc-500 opacity-0 group-hover:opacity-40'
          }`}>
            Profil
          </span>
        </button>
      </nav>
    </div>
  );
}

export default App;
