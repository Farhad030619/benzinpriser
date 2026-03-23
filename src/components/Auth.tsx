import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Flame, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Strict validation
  const validateForm = () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Vänligen ange en giltig e-postadress.');
      return false;
    }
    
    if (!isLogin) {
      // Strong password requirement: Min 8 chars, 1 uppercase, 1 number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Lösenordet måste vara minst 8 tecken, innehålla minst en stor bokstav och en siffra.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Fel e-post eller lösenord.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('E-postadressen används redan.');
      } else {
        setError('Ett fel uppstod: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-brand-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft">
          <Flame size={32} />
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bensinpris</h1>
        <p className="text-zinc-500">Hitta bäst pris & logga tankningar</p>
      </div>

      <div className="glass-card w-full p-6">
        <h2 className="text-xl font-bold mb-6 text-zinc-800">
          {isLogin ? 'Logga in' : 'Skapa konto'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm flex gap-2 items-start">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              placeholder="din@email.se"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-600 mb-1">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange text-white font-bold py-3.5 rounded-xl shadow-soft hover:bg-[#E06741] transition-colors disabled:opacity-70 mt-4"
          >
            {loading ? 'Väntar...' : isLogin ? 'Logga in' : 'Registrera'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-zinc-500 hover:text-brand-orange font-medium transition-colors"
          >
            {isLogin ? 'Har du inget konto? Registrera' : 'Har du redan ett konto? Logga in'}
          </button>
        </div>
      </div>
    </div>
  );
}
