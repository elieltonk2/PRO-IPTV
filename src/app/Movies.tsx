import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Play, Plus, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function Movies() {
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (s) => {
      setCategories(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(c => c.type === 'movie'));
    });
    
    const unsubMovies = onSnapshot(collection(db, 'movies'), (s) => {
      setMovies(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCat();
      unsubMovies();
    };
  }, []);

  const filteredMovies = selectedCategory 
    ? movies.filter(m => m.categoryId === selectedCategory)
    : movies;

  return (
    <div className="p-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Filmes</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-md">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!selectedCategory ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredMovies.map((movie) => (
          <motion.div
            key={movie.id}
            whileHover={{ scale: 1.05 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5">
              <img src={movie.posterUrl} className="w-full h-full object-cover" alt={movie.title} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                  <Play className="fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{movie.title}</h3>
                  <div className="flex items-center justify-center gap-1 text-yellow-500 text-xs mt-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{movie.rating || 'N/A'}</span>
                    <span className="text-gray-400 ml-2">{movie.releaseYear}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
