import { useState, FormEvent } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Search as SearchIcon, Play, Tv, Film, PlaySquare } from 'lucide-react';
import { motion } from 'motion/react';

export default function Search() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;

    setLoading(true);
    try {
      // In Firestore, searching is limited. For a real app, we'd use Algolia or similar.
      // Here we'll do a simple prefix search on movies as an example.
      const q = query(
        collection(db, 'movies'),
        where('title', '>=', term),
        where('title', '<=', term + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'movie' })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-12">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSearch} className="relative">
          <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 w-8 h-8" />
          <input
            type="text"
            placeholder="Busque por canais, filmes ou séries..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-20 pr-8 text-2xl text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-600"
          />
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-400">Resultados para "{term}"</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5">
                  <img src={item.posterUrl} className="w-full h-full object-cover" alt={item.title} referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                      <Play className="fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{item.title}</h3>
                      <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">{item.type}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : term && !loading ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500 space-y-4">
          <SearchIcon className="w-20 h-20 opacity-10" />
          <p className="text-xl">Nenhum resultado encontrado para "{term}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-40">
          <div className="bg-white/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
            <Tv className="w-12 h-12" />
            <h3 className="text-xl font-bold">Canais</h3>
            <p className="text-sm">Explore centenas de canais ao vivo de todo o mundo.</p>
          </div>
          <div className="bg-white/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
            <Film className="w-12 h-12" />
            <h3 className="text-xl font-bold">Filmes</h3>
            <p className="text-sm">Os últimos lançamentos e clássicos do cinema.</p>
          </div>
          <div className="bg-white/5 p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
            <PlaySquare className="w-12 h-12" />
            <h3 className="text-xl font-bold">Séries</h3>
            <p className="text-sm">Temporadas completas das suas séries favoritas.</p>
          </div>
        </div>
      )}
    </div>
  );
}
