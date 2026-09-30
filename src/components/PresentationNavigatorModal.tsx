import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Users,
  FolderEdit,
  FileSpreadsheet,
  Calendar,
  Kanban,
  Clock,
  MessageSquare,
  Share2,
  Video,
  BarChart3,
  ShieldCheck,
  Building2,
  LifeBuoy,
  HardDrive,
  LogIn,
  FileText,
  Network,
  Shield,
  Home,
  Navigation,
  Settings
} from 'lucide-react';
import { ViewScreen } from '../types';

interface QuickJumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: ViewScreen;
  onSelectScreen: (screen: ViewScreen) => void;
}

interface ScreenItem {
  id: ViewScreen;
  number: number;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
}

export const PresentationNavigatorModal: React.FC<QuickJumpModalProps> = ({
  isOpen,
  onClose,
  currentScreen,
  onSelectScreen
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const screens: ScreenItem[] = [
    { id: 'login', number: 1, name: 'Tela 01 • Login Corporativo', category: 'Acesso', description: 'Ambiente seguro com login e autenticação com PostgreSQL', icon: LogIn },
    { id: 'home', number: 2, name: 'Tela 02 • Home (Hub de Acesso Geral)', category: 'Início', description: 'Painel inicial pós-login com todos os ícones e atalhos para os módulos', icon: Home },
    { id: 'dashboard', number: 3, name: 'Tela 03 • Dashboard Executivo', category: 'Gestão', description: 'Visão panorâmica: colaboradores, produtividade por setor, tarefas e alertas', icon: LayoutDashboard },
    { id: 'planilhas', number: 4, name: 'Tela 04 • Base de Atividades (Planilha)', category: 'Processos', description: 'Tabela inteligente com ordenação, busca por setor e exportação Excel/CSV', icon: FileSpreadsheet },
    { id: 'agenda', number: 5, name: 'Tela 05 • Agenda & Reuniões', category: 'Pessoas', description: 'Visualização mês/semana/dia e reuniões corporativas', icon: Calendar },
    { id: 'meu_kanban', number: 6, name: 'Tela 06 • Meu Kanban (Individual)', category: 'Operação', description: 'Fluxo pessoal (Backlog, A Fazer, Em Andamento, Revisão, Concluído)', icon: Kanban },
    { id: 'kanban_equipe', number: 7, name: 'Tela 07 • Kanban da Equipe', category: 'Operação', description: 'Quadro interativo por setor com filtros semanais e responsáveis', icon: Kanban },
    { id: 'visao_semanal', number: 8, name: 'Tela 08 • Planejamento Semanal', category: 'Operação', description: 'Distribuição visual SEG a SEX com horas estimadas e tarefas críticas', icon: Calendar },
    { id: 'registro_ponto', number: 9, name: 'Tela 09 • Registro de Ponto Eletrônico', category: 'Pessoas', description: 'Registro biométrico com detecção facial e geolocalização', icon: Clock },
    { id: 'espelho_ponto', number: 10, name: 'Tela 10 • Espelho de Ponto Individual', category: 'Pessoas', description: 'Tabela consolidada de jornadas, saldo de horas e status mensal', icon: FileSpreadsheet },
    { id: 'gestao_ponto', number: 11, name: 'Tela 11 • Gestão de Ponto Corporativa', category: 'Pessoas', description: 'Painel da gerência com status em tempo real de toda a equipe e aprovações', icon: Users },
    { id: 'clientes', number: 12, name: 'Tela 12 • Gestão de Clientes & Contratos', category: 'Comercial', description: 'Carteira de clientes atendidos, planos contratados, SLAs e faturamento', icon: Building2 },
    { id: 'chamados', number: 13, name: 'Tela 13 • Help Desk & Chamados', category: 'Operação', description: 'Fila técnica de incidentes N1/N2/N3, priorização e controle de SLA', icon: LifeBuoy },
    { id: 'equipamentos', number: 14, name: 'Tela 14 • Inventário de Equipamentos', category: 'Infraestrutura', description: 'Gestão patrimonial de notebooks, servidores e termos de cautela', icon: HardDrive },
    { id: 'mobilidade', number: 15, name: 'Tela 15 • Mobilidade Corporativa & Frotas', category: 'Operação', description: 'Rastreamento de veículos, rotas com GPS físico real e gestão de deslocamentos', icon: Navigation },
    { id: 'relatorios', number: 16, name: 'Tela 16 • Relatórios Executivos', category: 'Governança', description: 'Indicadores de produtividade de setores, SLAs e análise automatizada', icon: BarChart3 },
    { id: 'auditoria', number: 17, name: 'Tela 17 • Trilha de Auditoria & Segurança', category: 'Governança', description: 'Syslog corporativo imutável para compliance, acessos e LGPD', icon: ShieldCheck },
    { id: 'colaboradores', number: 18, name: 'Tela 18 • Colaboradores (Área Privada: Gestão, Adm & RH)', category: 'Gestão & RH', description: 'Ambiente confidencial privado para Gestão, Administração e RH. Quadro funcional, dossiê contratual e salários', icon: Shield },
    { id: 'organograma', number: 19, name: 'Tela 19 • Organograma Institucional (Área Privada)', category: 'Estrutura • Privada', description: 'Árvore hierárquica interativa, linhas de comando e simulação de cargos', icon: Network },
    { id: 'configuracoes', number: 20, name: 'Tela 20 • Configurações do Sistema', category: 'Governança', description: 'Parâmetros de sistema, conexões e credenciais de segurança', icon: Settings }
  ];

  const filteredScreens = screens.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    String(s.number).includes(search)
  );

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        id="modal-quick-navigator"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <h2 className="font-bold text-base text-white">Navegador de Telas do GIHS System</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                22 Telas Prontas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer tela para pular diretamente durante a sua apresentação para stakeholders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Buscar tela por nome, número ou setor (ex: Kanban, Ponto, Clientes, 10)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-white mr-2">
              Limpar
            </button>
          )}
        </div>

        {/* Screen grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredScreens.map((s) => {
            const Icon = s.icon;
            const isCurrent = currentScreen === s.id;
            return (
              <button
                key={s.id}
                id={`quick-jump-screen-${s.id}`}
                onClick={() => {
                  onSelectScreen(s.id);
                  onClose();
                }}
                className={`flex items-start gap-3 p-3 rounded-xl text-left border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                    : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${isCurrent ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-700/60 text-slate-300">
                      TELA {s.number}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                      {s.category}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-400 font-semibold ml-auto flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Atual
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-white mt-1 truncate">{s.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{s.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Dica do Apresentador: Use as setas ou clique rápido para transitar entre os fluxos.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
