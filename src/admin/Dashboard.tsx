import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Users, Tv, Film, PlaySquare, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    channels: 0,
    movies: 0,
    series: 0
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setStats(prev => ({ ...prev, users: s.size })), (err) => console.error("Users stats error:", err));
    const unsubChannels = onSnapshot(collection(db, 'channels'), (s) => setStats(prev => ({ ...prev, channels: s.size })), (err) => console.error("Channels stats error:", err));
    const unsubMovies = onSnapshot(collection(db, 'movies'), (s) => setStats(prev => ({ ...prev, movies: s.size })), (err) => console.error("Movies stats error:", err));
    const unsubSeries = onSnapshot(collection(db, 'series'), (s) => setStats(prev => ({ ...prev, series: s.size })), (err) => console.error("Series stats error:", err));

    return () => {
      unsubUsers();
      unsubChannels();
      unsubMovies();
      unsubSeries();
    };
  }, [auth.currentUser]);

  const cards = [
    { label: 'Usuários Totais', value: stats.users, icon: Users, color: 'bg-blue-500' },
    { label: 'Canais ao Vivo', value: stats.channels, icon: Tv, color: 'bg-emerald-500' },
    { label: 'Filmes', value: stats.movies, icon: Film, color: 'bg-amber-500' },
    { label: 'Séries', value: stats.series, icon: PlaySquare, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Bem-vindo ao painel administrativo do Pro IPTV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -4 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Placeholder */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Atividade Recente
            </h2>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Novo usuário registrado</p>
                  <p className="text-xs text-slate-500">Há {i * 10} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Status do Sistema
            </h2>
          </div>
          <div className="space-y-6">
            <StatusItem label="API Backend" status="Online" color="text-emerald-500" />
            <StatusItem label="Banco de Dados" status="Online" color="text-emerald-500" />
            <StatusItem label="Servidor de Streaming" status="Online" color="text-emerald-500" />
            <StatusItem label="Armazenamento" status="92% Livre" color="text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full bg-current ${color}`}></div>
        <span className={`text-sm font-bold ${color}`}>{status}</span>
      </div>
    </div>
  );
}
