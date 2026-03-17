import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Mail, Calendar, Shield, LogOut, Bell, ShieldCheck } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function Settings() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        setUserData(userDoc.data());
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) return null;

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-12">
      <h1 className="text-4xl font-bold">Ajustes</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <User className="text-red-600" /> Perfil do Usuário
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome</p>
                <p className="text-lg font-medium">{userData?.displayName || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</p>
                <p className="text-lg font-medium">{userData?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">ID da Conta</p>
                <p className="text-sm font-mono text-gray-400">{userData?.uid}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Membro desde</p>
                <p className="text-lg font-medium">{userData?.createdAt ? formatDate(userData.createdAt) : 'N/A'}</p>
              </div>
            </div>
          </section>

          <section className="bg-white/5 rounded-3xl p-8 border border-white/5 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" /> Assinatura e Segurança
            </h2>
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                  <Calendar />
                </div>
                <div>
                  <p className="font-bold">Plano Premium Ativo</p>
                  <p className="text-sm text-emerald-500/80">Válido até {userData?.subscriptionExpiresAt ? formatDate(userData.subscriptionExpiresAt) : 'N/A'}</p>
                </div>
              </div>
              <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-emerald-600 transition-all">
                Renovar
              </button>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-2">Preferências</h3>
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <span>Notificações</span>
              </div>
              <div className="w-10 h-5 bg-red-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <span>Privacidade</span>
              </div>
            </button>
          </div>

          <button 
            onClick={() => auth.signOut()}
            className="w-full bg-red-600/10 text-red-500 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" /> Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
