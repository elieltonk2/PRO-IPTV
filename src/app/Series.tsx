import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Play, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function Series() {
  const [series, setSeries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (s) => {
      setCategories(s.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(c => c.type === 'series'));
    });
    
    const unsubSeries = onSnapshot(collection(db, 'series'), (s) => {
      setSeries(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCat();
      unsubSeries();
    };
  }, []);

  const filteredSeries = selectedCategory 
    ? series.filter(s => s.categoryId === selectedCategory)
    : series;

  return (
    <div className="p-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Séries</h1>
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
        {filteredSeries.map((s) => (
          <motion.div
            key={s.id}
            whileHover={{ scale: 1.05 }}
            className="group cursor-pointer"
          >
            <div className="aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5">
              <img src={s.posterUrl} className="w-full h-full object-cover" alt={s.title} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4 text-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black">
                  <Play className="fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{s.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{s.releaseYear}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
