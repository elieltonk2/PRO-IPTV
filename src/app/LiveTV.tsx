import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Play, Tv, Info, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';

export default function LiveTV() {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [showNotice, setShowNotice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const openInExternalPlayer = () => {
    if (!selectedChannel) return;
    const m3uContent = `#EXTM3U\n#EXTINF:-1,${selectedChannel.name}\n${selectedChannel.streamUrl}`;
    const blob = new Blob([m3uContent], { type: 'application/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedChannel.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m3u`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(collection(db, 'channels'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChannels(data);
      if (data.length > 0 && !selectedChannel) setSelectedChannel(data[0]);
    }, (err) => {
      console.error("Channels listener error:", err);
    });
    return unsub;
  }, [auth.currentUser]);

  useEffect(() => {
    if (!selectedChannel || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = selectedChannel.streamUrl;

    setLoading(true);
    setError(null);

    // Check for Mixed Content (HTTP on HTTPS)
    if (window.location.protocol === 'https:' && streamUrl.startsWith('http:')) {
      setError('CONTEÚDO INSEGURO (HTTP): O navegador pode bloquear este canal por segurança. Tente usar um link HTTPS ou abra o app em uma aba sem segurança.');
    }

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 20000,
        fragLoadingTimeOut: 20000,
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => {
          console.log("Autoplay blocked:", e);
          setError("Clique no play para iniciar o vídeo.");
        });
        setLoading(false);
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          setLoading(false);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response?.code === 0) {
                setError("Erro de Conexão (CORS/Protocolo): O servidor do canal não permite acesso via web ou você está tentando carregar um link HTTP em um site HTTPS.");
              } else {
                setError(`Erro de rede (${data.response?.code}): O link do canal pode estar offline.`);
              }
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Erro de mídia: O formato deste vídeo não é compatível com seu navegador.");
              hls.recoverMediaError();
              break;
            default:
              setError("Erro fatal: Não foi possível processar a transmissão deste canal.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(e => console.log("Autoplay blocked:", e));
        setLoading(false);
      });
      video.addEventListener('error', () => {
        setLoading(false);
        setError("Erro ao carregar vídeo no Safari.");
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [selectedChannel]);

  return (
    <div className="h-[calc(100vh-80px)] flex bg-brand-dark overflow-hidden">
      {/* Sidebar - Channel List */}
      <div className="w-80 flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-sm">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white/70 tracking-wide">Lista de Canais</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {channels.length === 0 && (
            <div className="p-10 text-center text-white/20">
              <Tv className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Nenhum canal encontrado.<br/>Importe uma lista no painel admin.</p>
            </div>
          )}
          {channels.map((channel, index) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={cn(
                "w-full px-6 py-4 flex items-center gap-4 transition-all group relative",
                selectedChannel?.id === channel.id 
                  ? "channel-item-active text-white" 
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="text-lg font-bold w-6 opacity-50">{index + 1}</span>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/10 group-hover:border-brand-accent/50 transition-colors">
                <img 
                  src={channel.logoUrl || `https://picsum.photos/seed/${channel.name}/100/100`} 
                  className="w-full h-full object-contain p-1" 
                  alt={channel.name} 
                  referrerPolicy="no-referrer" 
                />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-lg truncate">{channel.name}</p>
              </div>
              {selectedChannel?.id === channel.id && (
                <Play className="w-5 h-5 text-brand-accent fill-brand-accent animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {selectedChannel ? (
          <div className="w-full h-full relative group">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls
              playsInline
              poster={selectedChannel.logoUrl}
            />
            
            {(loading || error) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-20 p-8 text-center">
                <div className="flex flex-col items-center gap-6 max-w-md">
                  {loading && !error ? (
                    <>
                      <Loader2 className="w-16 h-16 text-brand-accent animate-spin" />
                      <p className="text-white font-black tracking-[0.2em] animate-pulse uppercase">Sintonizando Canal...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/50">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-red-500 font-black tracking-widest uppercase">Falha na Transmissão</p>
                        <p className="text-white/60 text-sm leading-relaxed">{error}</p>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <button 
                          onClick={() => setSelectedChannel({...selectedChannel})}
                          className="w-full px-8 py-3 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-brand-accent hover:text-white transition-all active:scale-95"
                        >
                          Tentar Novamente
                        </button>
                        <a 
                          href={selectedChannel.streamUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full px-8 py-3 bg-white/10 text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/20 transition-all text-sm"
                        >
                          Testar Link Direto
                        </a>
                        <button 
                          onClick={openInExternalPlayer}
                          className="w-full px-8 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-emerald-700 transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" /> Abrir no VLC / Externo
                        </button>
                        <button 
                          onClick={() => setShowHelp(true)}
                          className="w-full px-8 py-3 bg-brand-accent/20 text-brand-accent font-bold uppercase tracking-widest rounded-full hover:bg-brand-accent/30 transition-all text-sm"
                        >
                          Como Resolver?
                        </button>
                      </div>
                      {selectedChannel.streamUrl.startsWith('http:') && window.location.protocol === 'https:' && (
                        <p className="text-amber-400 text-[10px] mt-4 leading-tight">
                          Nota: Este canal usa HTTP. Navegadores modernos bloqueiam HTTP em sites HTTPS. 
                          Tente encontrar um link HTTPS para este canal.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notice Overlay */}
            <AnimatePresence>
              {showNotice && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] glass-panel p-6 rounded-2xl z-30"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-brand-red/20 rounded-full">
                      <Info className="w-6 h-6 text-brand-accent" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-white font-medium">• O serviço de membro é válido por 30 dias!</p>
                      <p className="text-white/60 text-sm leading-relaxed">
                        Por favor renove a tempo e você poderá continuar a desfrutar dos serviços de associação após a renovação.
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowNotice(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Channel Info Overlay */}
            <div className="absolute top-8 left-8 p-4 glass-panel rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
              <h1 className="text-2xl font-bold glow-text">{selectedChannel.name}</h1>
              <p className="text-brand-accent text-sm font-bold tracking-widest uppercase mt-1">Ao Vivo • HD</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 opacity-20">
            <Tv className="w-32 h-32 text-white" />
            <p className="text-2xl font-bold tracking-widest uppercase">Selecione um Canal</p>
          </div>
        )}
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-brand-dark border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Guia de Solução</h2>
                  <button onClick={() => setShowHelp(false)} className="text-white/40 hover:text-white">✕</button>
                </div>

                <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-brand-accent font-bold mb-1">1. O que está acontecendo?</p>
                    <p>O navegador bloqueia links "http" em sites "https" por segurança. Muitos canais de IPTV ainda usam o protocolo antigo (http).</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-brand-accent font-bold mb-1">2. Como resolver no PC?</p>
                    <p>Clique no ícone de cadeado ao lado da URL do site {'>'} Configurações do Site {'>'} Conteúdo Inseguro {'>'} Alterar para "Permitir". Recarregue a página.</p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-brand-accent font-bold mb-1">3. Melhor solução</p>
                    <p>Procure listas M3U que forneçam links "https". Eles são modernos e funcionam em qualquer dispositivo sem precisar de ajustes.</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-accent hover:text-white transition-all"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
