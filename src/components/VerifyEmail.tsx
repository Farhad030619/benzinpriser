import { auth } from '../lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Mail, CheckCircle, RefreshCcw, Loader2, Zap } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface VerifyEmailProps {
  user: User;
  onRefresh: () => void;
}

export default function VerifyEmail({ user, onRefresh }: VerifyEmailProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendEmailVerification(user);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 blur-[100px] rounded-full" />
         <div className="absolute bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-amber-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="glass-card p-12 text-center border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
          <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-900 mx-auto mb-8 flex items-center justify-center border border-white/5 text-white">
            <Mail size={42} strokeWidth={1.5} />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-2 italic">Verifiering Krävdes</p>
          <h2 className="text-3xl font-black tracking-tight uppercase leading-none text-white mb-6">KONTROLLERA DIN MAIL</h2>
          
          <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-10 px-4">
            Vi har skickat ett meddelande till <span className="text-white">{user.email}</span>. Aktivera ditt konto för att få full åtkomst.
          </p>

          <div className="space-y-4">
            <button 
              onClick={() => onRefresh()}
              className="w-full h-16 btn-primary flex items-center justify-center gap-3"
            >
              <Zap size={18} fill="currentColor" />
              <span>Jag har verifierat</span>
            </button>

            <button 
              onClick={handleResend}
              disabled={loading || sent}
              className="w-full h-14 glass-card font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 border border-white/5 hover:bg-zinc-800"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-zinc-400" />
              ) : sent ? (
                <> <CheckCircle size={16} className="text-emerald-500" /> Skickat! </>
              ) : (
                <> <RefreshCcw size={16} /> Skicka igen </>
              )}
            </button>

            <button 
              onClick={() => signOut(auth)}
              className="w-full pt-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-white transition-colors"
            >
              Logga ut och börja om
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
