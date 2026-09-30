import React from 'react';
import {
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Users,
  MessageSquare,
  Clock,
  Briefcase,
  Share2
} from 'lucide-react';
import { ViewScreen } from '../../types';

interface VisionOverviewViewProps {
  onNavigate: (screen: ViewScreen) => void;
  onOpenGuide: () => void;
}

export const VisionOverviewView: React.FC<VisionOverviewViewProps> = ({
  onNavigate,
  onOpenGuide
}) => {
  const connectedNodes = [
    { title: 'Atividades', desc: 'Apontamento técnico e horas', icon: Clock, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' },
    { title: 'Processos', desc: 'Formulários padronizados', icon: Layers, color: 'text-blue-400 border-blue-500/40 bg-blue-950/40' },
    { title: 'Ponto Eletrônico', desc: 'Jornada e banco de horas', icon: ShieldCheck, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' },
    { title: 'Tarefas & Kanban', desc: 'Individual e por setor', icon: Briefcase, color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' },
    { title: 'Chamados (Help Desk)', desc: 'SLA e atendimento N1/N2/N3', icon: Zap, color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' },
    { title: 'Agenda Corporativa', desc: 'Reuniões técnicas integradas', icon: Globe, color: 'text-teal-400 border-teal-500/40 bg-teal-950/40' },
    { title: 'Clientes & Contratos', desc: 'Gestão B2B e contratos de TI', icon: Users, color: 'text-purple-400 border-purple-500/40 bg-purple-950/40' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-in fade-in duration-300">
      {/* Hero Presentation Close Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>GIHS System • ARQUITETURA CONVERGENTE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            A Empresa Toda em um Só Lugar
          </h1>

          <p className="text-base sm:text-lg text-cyan-200/90 font-medium leading-relaxed">
            “Menos ferramentas dispersas. Mais controle, rastreabilidade e produtividade.”
          </p>

          <p className="text-xs text-slate-400 max-w-xl mx-auto">
            Uma plataforma unificada que conecta desde a batida de ponto do colaborador até o SLA contratual do cliente, orquestrada por inteligência artificial corporativa.
          </p>
        </div>
      </div>

      {/* Central Visual Connection Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">
            O QUE A PLATAFORMA CONECTA NATIVAMENTE
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedNodes.map((node, idx) => {
            const Icon = node.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all duration-300 shadow-lg ${node.color} flex items-start gap-4 hover:scale-[1.02]`}
              >
                <div className="p-3 rounded-xl bg-slate-950/80 border border-current shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{node.title}</h4>
                  <p className="text-xs text-slate-300/80 mt-1 leading-snug">{node.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Presentation Action Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <h4 className="text-sm font-bold text-white">Fim do Roteiro de Apresentação</h4>
          <p className="text-xs text-slate-400">
            Você pode reiniciar o ciclo ou explorar qualquer módulo através do menu lateral.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            id="btn-voltar-ao-inicio"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Voltar ao Início (Dashboard)</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={() => onNavigate('login')}
            id="btn-reiniciar-apresentacao"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reiniciar Apresentação</span>
          </button>

          <button
            onClick={onOpenGuide}
            id="btn-abrir-guia-visao"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-200" />
            <span>Abrir Guia do Apresentador</span>
          </button>
        </div>
      </div>
    </div>
  );
};
