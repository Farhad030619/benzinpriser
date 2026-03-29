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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

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
    <div className="relative min-h-screen bg-brand-bg text-[var(--text-main)] selection:bg-brand-orange/20 transition-colors duration-300">
      <AnimatePresence mode="wait">
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'home' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'home' ? 20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md mx-auto p-5 pb-32"
        >
          {activeTab === 'home' ? (
            <Dashboard />
          ) : (
            <Profile user={user} isDark={isDark} toggleTheme={toggleTheme} />
          )}
        </motion.main>
      </AnimatePresence>
 
      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-[var(--bg-card)] backdrop-blur-xl rounded-full shadow-2xl p-2 flex justify-around items-center z-50 border border-[var(--border-main)]">
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
              activeTab === 'home' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
            }`} 
          />
          <span className={`relative z-10 text-[9px] font-black mt-1 uppercase tracking-wider transition-colors duration-300 ${
            activeTab === 'home' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
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
              activeTab === 'profile' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
            }`} 
          />
          <span className={`relative z-10 text-[9px] font-black mt-1 uppercase tracking-wider transition-colors duration-300 ${
            activeTab === 'profile' ? 'text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
          }`}>
            Profil
          </span>
        </button>
      </nav>
    </div>
  );
}

export default App;
