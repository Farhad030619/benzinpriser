import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import VerifyEmail from './components/VerifyEmail';
import { MapPin, UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const refreshUser = () => {
    if (auth.currentUser) {
      // Force a re-render by creating a new object reference
      setUser({ ...auth.currentUser });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Loader2 className="w-10 h-10 text-brand-orange animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.emailVerified) {
    return <VerifyEmail user={user} onRefresh={refreshUser} />;
  }

  return (
    <div className="relative min-h-screen bg-brand-bg selection:bg-brand-orange/20">
      <AnimatePresence mode="wait">
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'home' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'home' ? 20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md mx-auto p-5 pb-32"
        >
          {activeTab === 'home' ? <Dashboard /> : <Profile user={user} />}
        </motion.main>
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-white/90 backdrop-blur-xl rounded-full shadow-2xl p-2 flex justify-around items-center z-50 border border-white/50">
        <button
          onClick={() => setActiveTab('home')}
          className="relative flex-1 flex flex-col items-center py-3 rounded-full transition-all duration-300 group"
        >
          {activeTab === 'home' && (
            <motion.div 
              layoutId="nav-bg"
              className="absolute inset-0 bg-brand-orange rounded-full shadow-brand"
            />
          )}
          <MapPin 
            size={20} 
            className={`relative z-10 transition-colors duration-300 ${
              activeTab === 'home' ? 'text-white fill-white/10' : 'text-zinc-400 group-hover:text-zinc-600'
            }`} 
          />
          <span className={`relative z-10 text-[9px] font-black mt-1 uppercase tracking-wider transition-colors duration-300 ${
            activeTab === 'home' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'
          }`}>
            Karta
          </span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className="relative flex-1 flex flex-col items-center py-3 rounded-full transition-all duration-300 group"
        >
          {activeTab === 'profile' && (
            <motion.div 
              layoutId="nav-bg"
              className="absolute inset-0 bg-brand-orange rounded-full shadow-brand"
            />
          )}
          <UserIcon 
            size={20} 
            className={`relative z-10 transition-colors duration-300 ${
              activeTab === 'profile' ? 'text-white fill-white/10' : 'text-zinc-400 group-hover:text-zinc-600'
            }`} 
          />
          <span className={`relative z-10 text-[9px] font-black mt-1 uppercase tracking-wider transition-colors duration-300 ${
            activeTab === 'profile' ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'
          }`}>
            Profil
          </span>
        </button>
      </nav>
    </div>
  );
}

export default App;
