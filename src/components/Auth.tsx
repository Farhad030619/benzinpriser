import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Flame, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

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
    setError('');
    auth.languageCode = 'sv';
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await sendEmailVerification(userCredential.user);
          setVerificationSent(true);
        } catch (verifErr: any) {
          console.error('Error sending verification email:', verifErr);
          setError('Kontot skapades, men kunde inte skicka verifieringsmejlet: ' + verifErr.message);
        }
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
    <div className="min-h-screen flex flex-col justify-center items-center px-6 relative overflow-hidden bg-brand-bg">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-brand-orange/5 rounded-full blur-3xl animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 z-10"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-brand-orange text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-brand rotate-12 hover:rotate-0 transition-transform duration-500"
        >
          <Flame size={40} />
        </motion.div>
        <h1 className="text-4xl font-black text-zinc-900 mb-2 tracking-tight">Bensinpris</h1>
        <p className="text-zinc-500 font-medium">Hitta bäst pris & logga tankningar</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card w-full max-w-sm p-8 z-10"
      >
        <AnimatePresence mode="wait">
          <motion.h2 
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="text-2xl font-black mb-8 text-zinc-800"
          >
            {isLogin ? 'Välkommen åter' : 'Skapa nytt konto'}
          </motion.h2>
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start border border-red-100"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {verificationSent && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 text-sm flex gap-3 items-start border border-green-100"
          >
            <div className="shrink-0 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</div>
            <span className="font-bold">Verifieringsmejl har skickats till din inkorg!</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">E-post</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="din@email.se"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Lösenord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full btn-primary mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Väntar...</span>
              </div>
            ) : isLogin ? 'Logga in' : 'Registrera dig'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-sm text-zinc-400 hover:text-brand-orange font-bold uppercase tracking-wider transition-colors"
          >
            {isLogin ? 'Skapa konto istället' : 'Har du redan konto? Logga in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
