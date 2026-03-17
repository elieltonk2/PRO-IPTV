import { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Film, Tv, PlaySquare, Plus, Trash2, Edit2, ExternalLink, Image as ImageIcon, FileUp, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '../lib/utils';

const contentSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  posterUrl: z.string().url('URL inválida'),
  backdropUrl: z.string().url('URL inválida').optional(),
  streamUrl: z.string().url('URL inválida'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['channel', 'movie', 'series']),
  releaseYear: z.number().optional(),
});

export default function Content() {
  const [activeTab, setActiveTab] = useState<'channel' | 'movie' | 'series'>('channel');
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isM3UModalOpen, setIsM3UModalOpen] = useState(false);
  const [m3uContent, setM3uContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(contentSchema),
    defaultValues: { type: activeTab }
  });

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'categories'), (s) => {
      setCategories(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const collectionName = activeTab === 'channel' ? 'channels' : activeTab === 'movie' ? 'movies' : 'series';
    const unsubItems = onSnapshot(collection(db, collectionName), (s) => {
      setItems(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCat();
      unsubItems();
    };
  }, [activeTab]);

  const onSubmit = async (data: any) => {
    const collectionName = data.type === 'channel' ? 'channels' : data.type === 'movie' ? 'movies' : 'series';
    try {
      if (editingItem) {
        await updateDoc(doc(db, collectionName, editingItem.id), data);
      } else {
        await addDoc(collection(db, collectionName), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  const deleteItem = async () => {
    if (!itemToDelete) return;
    const collectionName = activeTab === 'channel' ? 'channels' : activeTab === 'movie' ? 'movies' : 'series';
    try {
      await deleteDoc(doc(db, collectionName, itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error("Erro ao deletar item:", err);
      alert("Erro ao deletar item.");
    }
  };

  const deleteAll = async () => {
    if (items.length === 0) return;
    setIsDeletingAll(true);
    const collectionName = activeTab === 'channel' ? 'channels' : activeTab === 'movie' ? 'movies' : 'series';
    
    try {
      const chunks = [];
      for (let i = 0; i < items.length; i += 500) {
        chunks.push(items.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((item) => {
          batch.delete(doc(db, collectionName, item.id));
        });
        await batch.commit();
      }
      setShowDeleteAllConfirm(false);
    } catch (err) {
      console.error("Erro ao apagar todos:", err);
      alert("Erro ao apagar itens.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleM3UImport = async () => {
    if (!m3uContent.trim()) return;
    setImporting(true);
    try {
      const lines = m3uContent.split('\n');
      const channels: any[] = [];
      let currentChannel: any = {};

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // More flexible check for #EXTINF (handles spaces like # EXTINF :)
        if (line.toUpperCase().includes('#EXTINF')) {
          // Extract name (everything after the last comma)
          const nameMatch = line.match(/,(.*)$/);
          // Extract logo (handles tvg-logo="url" or tvg-logo = "url")
          const logoMatch = line.match(/tvg-logo\s*=\s*"(.*?)"/) || line.match(/tvg-logo="(.*?)"/);
          // Extract group
          const groupMatch = line.match(/group-title\s*=\s*"(.*?)"/) || line.match(/group-title="(.*?)"/);
          
          currentChannel = {
            name: nameMatch ? nameMatch[1].trim() : 'Canal Sem Nome',
            logoUrl: logoMatch ? logoMatch[1] : 'https://picsum.photos/seed/channel/200/200',
            type: 'channel',
            categoryId: categories.find(c => c.type === 'channel')?.id || 'default',
            description: groupMatch ? `Grupo: ${groupMatch[1]}` : 'Canal importado via M3U'
          };
        } else if (line.startsWith('http')) {
          currentChannel.streamUrl = line;
          if (currentChannel.name) {
            channels.push({ ...currentChannel });
          }
          currentChannel = {};
        }
      }

      // Batch write to Firestore
      const batch = writeBatch(db);
      channels.slice(0, 50).forEach((ch) => { // Limit to 50 for safety in batch
        const newDocRef = doc(collection(db, 'channels'));
        batch.set(newDocRef, ch);
      });
      await batch.commit();
      
      alert(`${channels.length} canais processados. Os primeiros 50 foram adicionados.`);
      setIsM3UModalOpen(false);
      setM3uContent('');
    } catch (err) {
      console.error(err);
      alert('Erro ao importar M3U');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Conteúdo</h1>
          <p className="text-slate-500">Gerencie canais, filmes e séries.</p>
        </div>
        <div className="flex gap-3">
          {items.length > 0 && (
            <button
              onClick={() => setShowDeleteAllConfirm(true)}
              disabled={isDeletingAll}
              className="bg-rose-100 hover:bg-rose-200 text-rose-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isDeletingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              Apagar Tudo
            </button>
          )}
          <button
            onClick={() => setIsM3UModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <FileUp className="w-5 h-5" /> Importar M3U
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              reset({ type: activeTab });
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" /> Adicionar {activeTab === 'channel' ? 'Canal' : activeTab === 'movie' ? 'Filme' : 'Série'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'channel', label: 'Canais', icon: Tv },
          { id: 'movie', label: 'Filmes', icon: Film },
          { id: 'series', label: 'Séries', icon: PlaySquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-sm" 
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
            <div className="aspect-video relative">
              <img 
                src={item.posterUrl || item.logoUrl} 
                className="w-full h-full object-cover" 
                alt={item.title || item.name}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    reset(item);
                    setIsModalOpen(true);
                  }}
                  className="p-2 bg-white text-indigo-600 rounded-lg hover:scale-110 transition-transform"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setItemToDelete(item)}
                  className="p-2 bg-white text-rose-600 rounded-lg hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-slate-900 truncate">{item.title || item.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{categories.find(c => c.id === item.categoryId)?.name || 'Sem categoria'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* M3U Import Modal */}
      {isM3UModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Importar Lista M3U</h2>
              <button onClick={() => setIsM3UModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-500">Cole o conteúdo do seu arquivo .m3u abaixo. O sistema irá extrair o nome, logo e URL de stream dos canais.</p>
              <textarea 
                value={m3uContent}
                onChange={(e) => setM3uContent(e.target.value)}
                placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo='...' group-title='...',Nome do Canal&#10;http://link-do-stream.com/live.m3u8"
                rows={10}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsM3UModalOpen(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleM3UImport}
                  disabled={importing || !m3uContent}
                  className="px-8 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {importing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                  {importing ? 'Processando...' : 'Importar Canais'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingItem ? 'Editar' : 'Adicionar'} Conteúdo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Título / Nome</label>
                  <input {...register('title')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message as string}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL do Stream</label>
                  <input {...register('streamUrl')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  {errors.streamUrl && <p className="text-rose-500 text-xs mt-1">{errors.streamUrl.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">URL do Poster/Logo</label>
                  <input {...register('posterUrl')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Categoria</label>
                  <select {...register('categoryId')} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Selecione...</option>
                    {categories.filter(c => c.type === activeTab).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                  <textarea {...register('description')} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 mb-6">Tem certeza que deseja excluir <strong>{itemToDelete.title || itemToDelete.name}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={deleteItem}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Apagar Tudo?</h3>
            <p className="text-slate-500 mb-6">
              Você está prestes a apagar <strong>TODOS</strong> os {items.length} {activeTab === 'channel' ? 'canais' : activeTab === 'movie' ? 'filmes' : 'séries'}. 
              <br/><span className="text-rose-600 font-bold">Esta ação é irreversível!</span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={deleteAll}
                disabled={isDeletingAll}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingAll ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isDeletingAll ? 'Apagando...' : 'Sim, Apagar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
