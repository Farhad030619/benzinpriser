import React, { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Fuel, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          displayName,
          email,
          createdAt: new Date(),
          points: 0,
          reports: 0
        });
        await sendEmailVerification(userCredential.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 font-body relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[20%] right-[10%] w-[50%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[10%] left-[5%] w-[40%] h-[30%] bg-amber-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Fuel className="text-zinc-950 w-10 h-10" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-2 italic">BENSINPRIS</h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em]">Industrial Fuel Telemetry</p>
        </div>

        <div className="glass-card p-8 !rounded-[3rem] border-white/5">
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="relative group">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="FÖRNAMN"
                      className="input-field pl-16 uppercase tracking-wider text-xs"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="email"
                placeholder="EMAIL ADRESS"
                className="input-field pl-16 uppercase tracking-wider text-xs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
              <input
                type="password"
                placeholder="LÖSENORD"
                className="input-field pl-16 uppercase tracking-wider text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-3 h-16 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="text-zinc-950">{isLogin ? 'Logga in' : 'Skapa konto'}</span>
                  <ArrowRight size={18} className="text-zinc-950 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
            >
              {isLogin ? 'Eget konto? Registrera dig här' : 'Har du redan ett konto? Logga in'}
            </button>
          </div>
        </div>
        
        {/* Footer Metrics */}
        <div className="mt-12 flex justify-center gap-8 opacity-40">
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase">AES-256</span>
              <span className="text-[8px] text-emerald-500">KRYPTERAT</span>
           </div>
           <div className="w-px h-6 bg-zinc-800" />
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest">TLS 1.3</span>
              <span className="text-[8px] text-emerald-500">SÄKERT</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
