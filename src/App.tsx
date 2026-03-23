import { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import { MapPin, UserIcon, Loader2 } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-orange animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="relative min-h-screen pb-24">
      <main className="max-w-md mx-auto p-5">
        {activeTab === 'home' ? <Dashboard /> : <Profile user={user} />}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm bg-white/90 backdrop-blur-md rounded-full shadow-xl p-2 flex justify-around items-center z-50 border border-zinc-100">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'home' ? 'bg-brand-orange text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <MapPin size={20} className={activeTab === 'home' ? 'fill-current' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Karta</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center py-2.5 rounded-full transition-all duration-300 ${
            activeTab === 'profile' ? 'bg-brand-orange text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <UserIcon size={20} className={activeTab === 'profile' ? 'fill-current' : ''} />
          <span className="text-[9px] font-black mt-1 uppercase tracking-wider">Profil</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
