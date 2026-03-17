import { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Tv, Mail, Lock, User, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Usuário Google',
          role: user.email === 'elieltonsilvak2@gmail.com' ? 'admin' : 'user',
          status: 'active',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError('Erro ao entrar com Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: user.email === 'elieltonsilvak2@gmail.com' ? 'admin' : 'user',
          status: 'active',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login por email não está ativo no Firebase. Use o botão "Entrar com Google" abaixo.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/iptv-dark/1920/1080?blur=10" 
          className="w-full h-full object-cover opacity-20"
          alt="Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-black/60 backdrop-blur-xl p-10 rounded-3xl border border-white/10 z-10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-brand-red rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-red/40 border border-white/10">
            <Tv className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic glow-text">Pro IPTV</h1>
          <p className="text-white/40 text-sm mt-3 font-medium uppercase tracking-widest">Sua plataforma definitiva</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
              <input
                type="text"
                placeholder="NOME COMPLETO"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent transition-all font-bold tracking-tight"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent transition-all font-bold tracking-tight"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
            <input
              type="password"
              placeholder="SENHA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-brand-accent transition-all font-bold tracking-tight"
              required
            />
          </div>

          {error && <p className="text-red-400 text-xs font-bold uppercase tracking-widest bg-red-500/10 p-4 rounded-2xl border border-red-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-accent hover:bg-red-600 text-white font-black py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-brand-red/20 uppercase tracking-widest"
          >
            {loading ? 'CARREGANDO...' : isLogin ? 'ENTRAR AGORA' : 'CRIAR MINHA CONTA'}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
              <span className="bg-[#120404] px-4 text-white/20">OU ACESSE COM</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl uppercase tracking-widest"
          >
            <Chrome className="w-5 h-5" />
            Google
          </button>
        </form>

        <div className="mt-8 text-center bg-white/5 p-4 rounded-2xl border border-white/5">
          <p className="text-white/40 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">
            {isLogin ? 'NOVO POR AQUI?' : 'JÁ É MEMBRO?'}
          </p>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-accent hover:text-white text-xs font-black uppercase tracking-widest transition-all hover:scale-105"
          >
            {isLogin ? 'Cadastre-se Gratuitamente' : 'Acesse sua Conta Agora'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
