import { useEffect, useState, FormEvent } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { List, Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'live' | 'movie' | 'series'>('live');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), { name, type });
      } else {
        await addDoc(collection(db, 'categories'), { name, type });
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      setName('');
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza? Isso pode afetar o conteúdo vinculado.')) {
      await deleteDoc(doc(db, 'categories', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categorias</h1>
          <p className="text-slate-500">Organize seu conteúdo por gêneros e tipos.</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setName('');
            setType('live');
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-5 h-5" /> Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['live', 'movie', 'series'].map((catType) => (
          <div key={catType} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 uppercase text-xs tracking-widest">
                {catType === 'live' ? 'TV ao Vivo' : catType === 'movie' ? 'Filmes' : 'Séries'}
              </h2>
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                {categories.filter(c => c.type === catType).length}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {categories.filter(c => c.type === catType).map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-700">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setName(cat.name);
                        setType(cat.type);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.filter(c => c.type === catType).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm italic">
                  Nenhuma categoria definida
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingCategory ? 'Editar' : 'Nova'} Categoria</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="live">TV ao Vivo</option>
                  <option value="movie">Filmes</option>
                  <option value="series">Séries</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
