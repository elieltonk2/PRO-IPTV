import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Heart, Play } from 'lucide-react';
import { motion } from 'motion/react';

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'favorites'), where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, async (snapshot) => {
      // In a real app, we would fetch the actual content details here.
      // For this demo, we'll just show the IDs or mock some data.
      setFavorites(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsub;
  }, []);

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-4xl font-bold flex items-center gap-4">
        <Heart className="text-red-600 fill-current" /> Meus Favoritos
      </h1>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500 space-y-4">
          <Heart className="w-20 h-20 opacity-10" />
          <p className="text-xl">Você ainda não tem favoritos.</p>
          <p className="text-sm">Adicione canais, filmes ou séries para vê-los aqui.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {favorites.map((fav) => (
            <motion.div
              key={fav.id}
              whileHover={{ scale: 1.05 }}
              className="group cursor-pointer"
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden relative border border-white/5 bg-white/5 flex items-center justify-center">
                <div className="text-center p-4">
                  <Play className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{fav.contentType}</p>
                  <p className="text-sm text-gray-400 mt-1">ID: {fav.contentId}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
