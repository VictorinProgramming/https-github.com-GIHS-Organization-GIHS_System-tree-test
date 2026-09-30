import React, { useState } from 'react';
import {
  Video,
  FileText,
  Calendar,
  Sparkles,
  Share2,
  Play,
  Instagram,
  Youtube,
  Linkedin,
  Clock,
  Plus,
  CheckCircle2,
  Flame,
  ExternalLink
} from 'lucide-react';
import { MARKETING_VIDEOS_QUEUE, SOCIAL_NETWORKS_STATUS } from '../../data/mockData';
import { MarketingVideoItem } from '../../types';

export const MarketingHubView: React.FC = () => {
  const [videosQueue, setVideosQueue] = useState<MarketingVideoItem[]>(MARKETING_VIDEOS_QUEUE);
  const [selectedVideo, setSelectedVideo] = useState<MarketingVideoItem | null>(MARKETING_VIDEOS_QUEUE[0]);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleGenerateScript = (e: React.FormEvent) => {
    e.preventDefault();
    const newVid: MarketingVideoItem = {
      id: `vid-${Date.now()}`,
      title: scriptTopic || 'Inovações em Cloud e IA para TI',
      theme: 'Infraestrutura Moderna',
      status: 'Roteiro pronto',
      platform: 'LinkedIn & YouTube',
      duration: '01:15',
      scriptPreview: 'Roteiro de 60 segundos com gancho inicial sobre redução de custos em nuvem e automação com IA.'
    };
    setVideosQueue([newVid, ...videosQueue]);
    setIsScriptModalOpen(false);
    setScriptTopic('');
    setToastMessage('✓ Novo roteiro gerado com inteligência artificial.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Hub de Conteúdo & Redes Sociais
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automação de roteiros, esteira de vídeos explicativos e cronograma editorial corporativo
          </p>
        </div>

        <button
          onClick={() => setIsScriptModalOpen(true)}
          id="btn-novo-roteiro-ia"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span>+ Criar Roteiro com IA</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 Cards Requested: Criador de Roteiros, Planejador de Postagens, Geração de Vídeo com IA, Publicação Automática */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Criador de Roteiros */}
        <div 
          onClick={() => setIsScriptModalOpen(true)}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-md group"
        >
          <div className="p-2.5 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/60 w-fit mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300">
            Criador de Roteiros
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Gera ganchos, corpo explicativo e chamadas para ação técnicas.
          </p>
          <span className="inline-block text-[10px] font-mono text-cyan-400 mt-3">
            Ativar criador →
          </span>
        </div>

        {/* Planejador de Postagens */}
        <div 
          onClick={() => {
            setToastMessage('📅 Calendário editorial sincronizado para 3 postagens semanais.');
            setTimeout(() => setToastMessage(null), 3000);
          }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-md group"
        >
          <div className="p-2.5 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/60 w-fit mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-blue-300">
            Planejador de Postagens
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Cronograma automático de distribuição por horários de maior engajamento.
          </p>
          <span className="inline-block text-[10px] font-mono text-blue-400 mt-3">
            Ver cronograma →
          </span>
        </div>

        {/* Geração de Vídeo com IA */}
        <div 
          onClick={() => {
            setToastMessage('🎬 Módulo de renderização simulada ativado para o próximo roteiro.');
            setTimeout(() => setToastMessage(null), 3000);
          }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-md group"
        >
          <div className="p-2.5 rounded-xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 w-fit mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-indigo-300">
            Geração de Vídeo com IA
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Síntese de voz neural, avatares técnicos e legendas automáticas.
          </p>
          <span className="inline-block text-[10px] font-mono text-indigo-400 mt-3">
            Simular render →
          </span>
        </div>

        {/* Publicação Automática */}
        <div 
          onClick={() => {
            setToastMessage('🚀 Publicação automática simulada: integrações prontas para envio.');
            setTimeout(() => setToastMessage(null), 3000);
          }}
          className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer shadow-md group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 w-fit mb-3">
            <Share2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-300">
            Publicação Automática
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Disparo multicanal para Reels, TikTok, YouTube Shorts e LinkedIn.
          </p>
          <span className="inline-block text-[10px] font-mono text-emerald-400 mt-3">
            Configurar gatilhos →
          </span>
        </div>
      </div>

      {/* Redes Sociais Conectadas (Instagram, TikTok, YouTube, LinkedIn com indicação 'Planejado') */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-cyan-400" />
            Canais Sociais Integrados
          </h3>
          <span className="text-xs font-mono text-slate-400">Ambiente de Demonstração</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SOCIAL_NETWORKS_STATUS.map((net) => (
            <div
              key={net.name}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white font-bold text-xs">
                  {net.name === 'Instagram' && <Instagram className="w-4 h-4 text-pink-400" />}
                  {net.name === 'TikTok' && <span className="text-cyan-400 font-mono text-xs">TT</span>}
                  {net.name === 'YouTube' && <Youtube className="w-4 h-4 text-rose-500" />}
                  {net.name === 'LinkedIn' && <Linkedin className="w-4 h-4 text-blue-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{net.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{net.account}</span>
                </div>
              </div>

              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {net.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fila de Vídeos Gerados: "Como funciona o suporte de TI?", "O que faz um DBA?", "Dicas de segurança digital" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              Fila de Produção de Vídeos
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {videosQueue.length} itens na esteira
            </span>
          </div>

          <div className="space-y-3">
            {videosQueue.map((vid) => {
              const isSelected = selectedVideo?.id === vid.id;
              return (
                <div
                  key={vid.id}
                  onClick={() => setSelectedVideo(vid)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">{vid.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                        {vid.duration}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {vid.theme} • {vid.platform}
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap self-start sm:self-center ${
                    vid.status === 'Pronto para publicar'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : vid.status === 'Renderizando'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  }`}>
                    {vid.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Video Details & Script Preview */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {selectedVideo && (
            <>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  Detalhes do Vídeo
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{selectedVideo.title}</h3>
                <span className="text-xs text-slate-400">{selectedVideo.theme}</span>
              </div>

              {/* Mock Video Preview Screen */}
              <div className="w-full aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                <div className="w-12 h-12 rounded-full bg-cyan-600/30 border border-cyan-400 text-cyan-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <span className="text-[11px] font-mono text-slate-400 mt-2">
                  Preview 1080x1920 (Vertical 9:16)
                </span>
                <div className="absolute bottom-2 left-3 right-3 flex justify-between text-[10px] font-mono text-slate-500">
                  <span>00:00 / {selectedVideo.duration}</span>
                  <span>Audio: PT-BR Neural</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  Roteiro Aprovado:
                </span>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedVideo.scriptPreview}
                </div>
              </div>

              <button
                onClick={() => {
                  setToastMessage(`✓ Disparo agendado para as redes: ${selectedVideo.platform}`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Aprovar & Agendar Publicação
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal: Novo Roteiro com IA */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Gerar Roteiro Técnico com IA
              </h3>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateScript} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tema ou Pergunta do Vídeo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Como funciona a mitigação de ataques DDoS?"
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                O GIHS Agents criará um gancho de 3 segundos, 3 tópicos didáticos e CTA para captação de clientes B2B.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  Gerar Roteiro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
