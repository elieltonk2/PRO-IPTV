import { useEffect, useState } from 'react';
import { collection, query, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Play, Info, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [featured, setFeatured] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Movies
    const qMovies = query(collection(db, 'movies'), limit(10));
    const unsubMovies = onSnapshot(qMovies, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMovies(data);
      if (data.length > 0 && !featured) setFeatured(data[0]);
    });

    // Fetch Series
    const qSeries = query(collection(db, 'series'), limit(10));
    const unsubSeries = onSnapshot(qSeries, (snapshot) => {
      setSeries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Channels
    const qChannels = query(collection(db, 'channels'), limit(10));
    const unsubChannels = onSnapshot(qChannels, (snapshot) => {
      setChannels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubMovies();
      unsubSeries();
      unsubChannels();
    };
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      {featured && (
        <div className="relative h-[85vh] w-full overflow-hidden">
          <img 
            src={featured.backdropUrl || featured.posterUrl} 
            className="w-full h-full object-cover scale-105"
            alt={featured.title}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>
          
          <div className="absolute bottom-32 left-12 max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-7xl font-black tracking-tighter glow-text uppercase italic">
                {featured.title}
              </h1>
              <div className="flex items-center gap-4 mt-4 text-brand-accent font-bold tracking-widest uppercase text-sm">
                <span>4K Ultra HD</span>
                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                <span>2024</span>
                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                <span className="px-2 py-0.5 border border-brand-accent rounded text-[10px]">16+</span>
              </div>
              <p className="text-xl text-white/70 line-clamp-3 mt-6 leading-relaxed max-w-2xl">
                {featured.description}
              </p>
            </motion.div>

            <div className="flex gap-6">
              <button className="bg-brand-accent text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-red-600 transition-all transform hover:scale-105 shadow-lg shadow-brand-red/20">
                <Play className="fill-current w-6 h-6" /> Assistir Agora
              </button>
              <button className="bg-white/10 backdrop-blur-xl text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/20 transition-all border border-white/10">
                <Plus className="w-6 h-6" /> Minha Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Rows */}
      <div className="px-12 -mt-24 relative z-10 space-y-16">
        <ContentRow title="Canais em Destaque" items={channels} type="channel" />
        <ContentRow title="Filmes Recomendados" items={movies} type="movie" />
        <ContentRow title="Séries em Alta" items={series} type="series" />
      </div>
    </div>
  );
}

function ContentRow({ title, items, type }: { title: string, items: any[], type: string }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic glow-text">{title}</h2>
        <button className="text-brand-accent font-bold text-sm hover:underline uppercase tracking-widest">Ver Tudo</button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.05, y: -10 }}
            className="flex-shrink-0 w-56 md:w-72 cursor-pointer group relative"
          >
            <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-all group-hover:border-brand-accent/50">
              <img 
                src={item.backdropUrl || item.posterUrl || item.logoUrl} 
                className="w-full h-full object-cover"
                alt={item.title || item.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
              <div className="absolute inset-0 bg-brand-red/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-xl transform scale-0 group-hover:scale-100 transition-transform duration-300">
                  <Play className="fill-current w-6 h-6 ml-1" />
                </div>
                <span className="text-white font-black uppercase tracking-tighter text-sm opacity-0 group-hover:opacity-100 transition-opacity delay-100">Reproduzir</span>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-white/90 group-hover:text-brand-accent transition-colors truncate uppercase tracking-tight">
                {item.title || item.name}
              </h3>
              <p className="text-xs text-white/40 font-medium uppercase tracking-widest">
                {type === 'channel' ? 'Canal • Ao Vivo' : type === 'movie' ? 'Filme • 4K' : 'Série • HD'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
