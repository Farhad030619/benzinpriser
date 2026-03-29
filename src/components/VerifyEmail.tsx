import { useState } from 'react';
import { auth } from '../lib/firebase';
import { sendEmailVerification, signOut, reload, type User } from 'firebase/auth';
import { Mail, RefreshCcw, LogOut, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface VerifyEmailProps {
  user: User;
  onRefresh: () => void;
}

export default function VerifyEmail({ user, onRefresh }: VerifyEmailProps) {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await reload(user);
      onRefresh();
    } catch (error) {
      console.error('Error reloading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (error) {
      alert('Kunde inte skicka mejlet. Försök igen om en stund.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-brand-bg relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-sm p-8 text-center z-10"
      >
        <div className="w-20 h-20 bg-orange-50 text-brand-orange rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-soft">
          <Mail size={40} />
        </div>

        <h2 className="text-2xl font-black mb-2 text-zinc-800 tracking-tight">Verifiera din e-post</h2>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
          Vi har skickat ett verifieringsmejl till <br />
          <span className="font-bold text-zinc-800">{user.email}</span>. <br />
          Vänligen klicka på länken i mejlet för att aktivera ditt konto.
        </p>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCcw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            <span>Jag har verifierat</span>
          </motion.button>

          <button
            onClick={handleResend}
            disabled={loading || resent}
            className="text-xs font-bold text-zinc-400 hover:text-brand-orange uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            {resent ? 'Mejl skickat!' : 'Skicka verifieringsmejl igen'}
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100">
          <button
            onClick={() => signOut(auth)}
            className="flex items-center justify-center gap-2 text-zinc-400 hover:text-red-500 transition-colors mx-auto text-sm font-bold"
          >
            <LogOut size={16} />
            <span>Logga ut</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
