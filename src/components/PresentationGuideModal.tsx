import React from 'react';
import {
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Clock,
  Kanban,
  MessageSquare,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { ViewScreen } from '../types';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScreen: (screen: ViewScreen) => void;
}

export const PresentationGuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onSelectScreen
}) => {
  if (!isOpen) return null;

  const keyStories = [
    {
      title: '1. O Panorama Executivo & Estratégico',
      subtitle: 'Como a diretoria e liderança monitoram a empresa em tempo real',
      screens: [
        { label: 'Tela 02: Dashboard Executivo', id: 'dashboard' as ViewScreen },
        { label: 'Tela 14: Relatórios & SLAs com IA', id: 'relatorios' as ViewScreen }
      ],
      icon: Compass,
      color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30'
    },
    {
      title: '2. Operação Integrada dos Setores de TI',
      subtitle: 'Como o time técnico (N1, N2, N3, Devs, DBA e Cyber) executa tarefas e incidentes',
      screens: [
        { label: 'Tela 06: Meu Kanban (Individual)', id: 'meu_kanban' as ViewScreen },
        { label: 'Tela 07: Kanban da Equipe N2', id: 'kanban_equipe' as ViewScreen },
        { label: 'Tela 08: Planejamento Semanal', id: 'visao_semanal' as ViewScreen },
        { label: 'Tela 18: Help Desk & Chamados', id: 'chamados' as ViewScreen }
      ],
      icon: Kanban,
      color: 'from-indigo-500/20 to-cyan-500/10 border-indigo-500/30'
    },
    {
      title: '3. RH, Gestão de Pessoas & Jornada',
      subtitle: 'Controle biométrico simulado, espelho mensal e supervisão de equipe',
      screens: [
        { label: 'Tela 10: Ponto com Simulação Facial', id: 'registro_ponto' as ViewScreen },
        { label: 'Tela 11: Espelho de Ponto Individual', id: 'espelho_ponto' as ViewScreen },
        { label: 'Tela 12: Gestão de Ponto Corporativa', id: 'gestao_ponto' as ViewScreen },
        { label: 'Tela 20: Equipe (48 Colaboradores)', id: 'colaboradores' as ViewScreen }
      ],
      icon: Clock,
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30'
    },
    {
      title: '4. Atendimento, CRM & Infraestrutura',
      subtitle: 'Gestão de contratos com clientes e inventário patrimonial de TI',
      screens: [
        { label: 'Clientes & Contratos', id: 'clientes' as ViewScreen },
        { label: 'Inventário de Equipamentos', id: 'equipamentos' as ViewScreen }
      ],
      icon: Users,
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30'
    },
    {
      title: '5. Governança, Relatórios & Auditoria',
      subtitle: 'Painéis consolidados, relatórios gerenciais e compliance imutável LGPD',
      screens: [
        { label: 'Central de Relatórios', id: 'relatorios' as ViewScreen },
        { label: 'Trilha de Auditoria & Segurança', id: 'auditoria' as ViewScreen }
      ],
      icon: ShieldCheck,
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="modal-presentation-guide"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Roteiro de Apresentação Executiva</h2>
              <p className="text-xs text-slate-400">
                Guia com os 5 principais fluxos de demonstração para a banca e convidados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
            <span className="font-bold text-cyan-300">Pergunta Central da Apresentação:</span>
            <p className="text-sm font-semibold text-white mt-1">
              “Como seria administrar uma empresa de TI inteira através de uma única plataforma?”
            </p>
            <p className="text-slate-400 mt-1">
              Slogan oficial: <span className="italic text-slate-200">“Tudo conectado. Todos os processos monitorados.”</span>
            </p>
          </div>

          <div className="space-y-3">
            {keyStories.map((story, idx) => {
              const Icon = story.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border bg-gradient-to-r ${story.color} space-y-2`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">{story.title}</h3>
                  </div>
                  <p className="text-xs text-slate-300">{story.subtitle}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {story.screens.map((sc, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => {
                          onSelectScreen(sc.id);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500 text-xs font-medium text-slate-200 hover:text-cyan-300 transition-all"
                      >
                        <span>{sc.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            GIHS System • Enterprise Intelligence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all"
          >
            Entendido, Continuar
          </button>
        </div>
      </div>
    </div>
  );
};
