import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Calendar,
  Kanban,
  Clock,
  BarChart3,
  ShieldCheck,
  Network,
  Settings,
  Building2,
  HardDrive,
  PhoneCall,
  Navigation,
  LifeBuoy,
  FileText,
  UserCheck,
  Search,
  ArrowRight,
  Sparkles,
  Accessibility,
  Clock3,
  Shield,
  Layers,
  LogIn,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { ViewScreen, Collaborator } from '../../types';
import { GIHSLogo } from '../GIHSLogo';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useTheme } from '../../contexts/ThemeContext';

interface HomeViewProps {
  currentUser: Collaborator;
  onNavigate: (screen: ViewScreen) => void;
}

interface ModuleItem {
  id: ViewScreen;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  category: string;
  badge?: string;
  badgeColor?: string;
  accentColor: string;
}

export const HomeView: React.FC<HomeViewProps> = ({ currentUser, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const { setIsModalOpen, highContrast } = useAccessibility();
  const { 
    isLight, 
    isDark, 
    primaryColor, 
    backgroundColor, 
    navbarColor,
    isNavbarLight,
    cardColor,
    isCardLight,
    toggleThemeMode, 
    setIsColorModalOpen 
  } = useTheme();

  // Módulos sincronizados com a barra de navegação à esquerda
  const modules: ModuleItem[] = [
    // GESTÃO OPERACIONAL
    {
      id: 'dashboard',
      title: 'Dashboard Executivo',
      subtitle: 'Visão Geral & Indicadores',
      description: 'Métricas em tempo real de chamados, disponibilidade de servidores, telemetria e gráficos executivos.',
      icon: LayoutDashboard,
      category: 'GESTÃO OPERACIONAL',
      badge: 'Principal',
      badgeColor: 'bg-[#0067FC]/20 text-[#00A6FC] border-[#0067FC]/40',
      accentColor: '#0067FC'
    },
    {
      id: 'chamados',
      title: 'Central de Chamados',
      subtitle: 'Help Desk & Suporte N1-N3',
      description: 'Abertura, triagem inteligente, filas de atendimento, SLA dinâmico e resolução de tickets corporativos.',
      icon: LifeBuoy,
      category: 'GESTÃO OPERACIONAL',
      badge: 'Ativo',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      accentColor: '#10B981'
    },
    {
      id: 'planilhas',
      title: 'Planilhas Inteligentes',
      subtitle: 'Dados Dinâmicos & PostgreSQL',
      description: 'Planilhas corporativas com cálculos integrados, filtros avançados e sincronização instantânea com banco de dados.',
      icon: FileSpreadsheet,
      category: 'GESTÃO OPERACIONAL',
      badge: 'SQL',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
      accentColor: '#06B6D4'
    },
    {
      id: 'agenda',
      title: 'Agenda & Calendário',
      subtitle: 'Compromissos & Manutenções',
      description: 'Gestão de reuniões com clientes, alinhamentos de squad, janelas de manutenção técnica e compromissos.',
      icon: Calendar,
      category: 'GESTÃO OPERACIONAL',
      accentColor: '#3B82F6'
    },

    // PRODUTIVIDADE
    {
      id: 'meu_kanban',
      title: 'Meu Kanban Pessoal',
      subtitle: 'Minhas Demandas & Tarefas',
      description: 'Quadro ágil individual para controle das suas atividades: Backlog, Em Andamento, Revisão e Concluídas.',
      icon: Kanban,
      category: 'PRODUTIVIDADE',
      badge: 'Pessoal',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      accentColor: '#8B5CF6'
    },
    {
      id: 'kanban_equipe',
      title: 'Kanban da Equipe',
      subtitle: 'Gestão Ágil de Demandas',
      description: 'Visão consolidada das tarefas de todo o time técnico, distribuição de carga e validação de entregas.',
      icon: Layers,
      category: 'PRODUTIVIDADE',
      badge: 'Gestão',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
      accentColor: '#6366F1'
    },
    {
      id: 'visao_semanal',
      title: 'Visão Semanal',
      subtitle: 'Planejamento de Atividades',
      description: 'Distribuição visual do cronograma de trabalho da equipe de segunda a domingo para previsibilidade operacional.',
      icon: Clock3,
      category: 'PRODUTIVIDADE',
      accentColor: '#0EA5E9'
    },
    {
      id: 'sobreaviso',
      title: 'Escala de Sobreaviso',
      subtitle: 'Plantões & Celulares de Plantão',
      description: 'Quadro oficial de técnicos de sobreaviso, telefones corporativos em custódia e histórico de acionamentos.',
      icon: PhoneCall,
      category: 'PRODUTIVIDADE',
      badge: 'Plantão',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      accentColor: '#F59E0B'
    },

    // PONTO & JORNADA
    {
      id: 'registro_ponto',
      title: 'Registro de Ponto',
      subtitle: 'Biometria Facial & GPS',
      description: 'Batimento de ponto eletrônico com reconhecimento facial biométrico, prova de vida e geolocalização.',
      icon: Clock,
      category: 'PONTO & JORNADA',
      badge: 'RH',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      accentColor: '#10B981'
    },
    {
      id: 'espelho_ponto',
      title: 'Espelho de Ponto',
      subtitle: 'Histórico & Banco de Horas',
      description: 'Extrato detalhado de marcações, horas trabalhadas, saldo de banco de horas e justificativas de ponto.',
      icon: FileText,
      category: 'PONTO & JORNADA',
      accentColor: '#14B8A6'
    },
    {
      id: 'gestao_ponto',
      title: 'Gestão de Ponto RH',
      subtitle: 'Auditoria de Horas & Fechamento',
      description: 'Painel do departamento de Recursos Humanos para aprovação de abonos, relatórios fiscais e fechamento mensal.',
      icon: UserCheck,
      category: 'PONTO & JORNADA',
      badge: 'RH Admin',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      accentColor: '#0284C7'
    },

    // COMERCIAL & ATIVOS
    {
      id: 'clientes',
      title: 'Gestão de Clientes',
      subtitle: 'Contratos & Unidades',
      description: 'Cadastro de clientes corporativos, vigência de contratos, nível de SLA contratado e histórico de chamados.',
      icon: Building2,
      category: 'COMERCIAL & ATIVOS',
      badge: 'Admin',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      accentColor: '#2563EB'
    },
    {
      id: 'equipamentos',
      title: 'Gestão de Ativos',
      subtitle: 'Hardware, Rede & Periféricos',
      description: 'Inventário completo de ativos de TI: servidores, switches, notebooks corporativos e termos de custódia.',
      icon: HardDrive,
      category: 'COMERCIAL & ATIVOS',
      badge: 'Admin',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      accentColor: '#3B82F6'
    },

    // GOVERNANÇA & AUDITORIA
    {
      id: 'mobilidade',
      title: 'Mobilidade Corporativa',
      subtitle: 'Frotas & Rotas em Tempo Real',
      description: 'Rastreamento de veículos com GPS físico real, gestão de odômetro (KM), Ponto A até Ponto B geocodificado.',
      icon: Navigation,
      category: 'GOVERNANÇA',
      badge: 'GPS Real',
      badgeColor: 'bg-[#0067FC]/20 text-[#00A6FC] border-[#0067FC]/40',
      accentColor: '#0067FC'
    },
    {
      id: 'relatorios',
      title: 'Central de Relatórios',
      subtitle: 'Inteligência Operacional & BI',
      description: 'Geração e exportação analítica de relatórios de produtividade, volumetria de suporte e cumprimento de SLA.',
      icon: BarChart3,
      category: 'GOVERNANÇA',
      badge: 'BI',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      accentColor: '#9333EA'
    },
    {
      id: 'auditoria',
      title: 'Auditoria do Sistema',
      subtitle: 'Trilhas Forenses & LGPD',
      description: 'Logs criptográficos de segurança com carimbo de tempo, IP de origem, operações executadas e conformidade.',
      icon: ShieldCheck,
      category: 'GOVERNANÇA',
      badge: 'Segurança',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      accentColor: '#E11D48'
    },
    {
      id: 'colaboradores',
      title: 'Quadro de Colaboradores',
      subtitle: 'Equipe, Cargos & Contatos',
      description: 'Dossiê cadastral dos funcionários de TI, estrutura de cargos, níveis de permissão e contatos corporativos.',
      icon: Users,
      category: 'GOVERNANÇA',
      accentColor: '#0284C7'
    },
    {
      id: 'organograma',
      title: 'Organograma Institucional',
      subtitle: 'Hierarquia & Setores',
      description: 'Estrutura organizacional completa com visualização de líderes, subordinação e equipes por departamento.',
      icon: Network,
      category: 'GOVERNANÇA',
      accentColor: '#4F46E5'
    },
    {
      id: 'configuracoes',
      title: 'Configurações de TI',
      subtitle: 'Parâmetros & PostgreSQL',
      description: 'Gerenciamento de conexões de banco de dados, chaves de autenticação, variáveis e parâmetros do sistema.',
      icon: Settings,
      category: 'GOVERNANÇA',
      accentColor: '#64748B'
    }
  ];

  const categories = useMemo(() => {
    return ['TODOS', 'GESTÃO OPERACIONAL', 'PRODUTIVIDADE', 'PONTO & JORNADA', 'COMERCIAL & ATIVOS', 'GOVERNANÇA'];
  }, []);

  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      const matchesCategory = selectedCategory === 'TODOS' || mod.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        mod.title.toLowerCase().includes(q) ||
        mod.subtitle.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [modules, selectedCategory, searchQuery]);

  return (
    <div 
      style={{ backgroundColor }}
      className={`min-h-screen ${isLight ? 'text-slate-900' : 'text-white'} flex flex-col transition-colors duration-200`}
    >
      {/* BARRA SUPERIOR DE BOAS-VINDAS & ACESSIBILIDADE */}
      <header 
        style={{ backgroundColor: navbarColor }}
        className={`border-b ${isNavbarLight ? 'border-slate-200 text-slate-900 shadow-sm' : 'border-[#0A2854] text-white shadow-xl'} backdrop-blur-md px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 transition-colors duration-200`}
      >
        <div className="flex items-center gap-3">
          <GIHSLogo variant="system" mode="transparent" height={38} showTagline={false} />
          <div className={`h-6 w-px ${isNavbarLight ? 'bg-slate-300' : 'bg-[#0A2854]'} hidden sm:block`} />
          <span className="text-xs font-mono font-bold tracking-wider uppercase hidden sm:inline" style={{ color: primaryColor }}>
            Hub de Acesso Geral • Portal de Início
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Alternar Modo Claro (Branco) / Escuro (Azul) */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'border-cyan-500/40 bg-[#041838] text-cyan-300 hover:bg-[#06204a]'
                : 'border-amber-500/40 bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            title={isDark ? 'Mudar para Modo Claro (Fundo Branco #FFFFFF)' : 'Mudar para Modo Escuro (Fundo Azul #01122D)'}
          >
            {isDark ? (
              <>
                <Moon className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Fundo Azul</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Fundo Branco</span>
              </>
            )}
          </button>

          {/* Personalizar Cores */}
          <button
            type="button"
            onClick={() => setIsColorModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#041838] border-[#0A2854] text-slate-200 hover:bg-[#0067FC] hover:text-white'
            }`}
            title="Personalizar cores e layout (Alt + C)"
          >
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-xs shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <Palette className="w-4 h-4 text-[#00A6FC]" />
            <span className="hidden sm:inline">Cores</span>
          </button>

          {/* Central de Acessibilidade */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#041838] hover:bg-[#0067FC] text-slate-200 hover:text-white border-[#0A2854]'
            }`}
            title="Abrir Central de Acessibilidade (Alt + A)"
          >
            <Accessibility className="w-4 h-4 text-[#00A6FC]" />
            <span className="hidden sm:inline">Acessibilidade</span>
          </button>

          {/* Trocar de Conta / Tela de Login */}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#041838] hover:bg-slate-700 text-slate-300 hover:text-white border-[#0A2854]'
            }`}
            title="Ir para tela de Login / Autenticação com credenciais"
          >
            <LogIn className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Trocar Conta</span>
          </button>

          {/* Perfil do Usuário Logado */}
          <div className={`flex items-center gap-2.5 p-1.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#041838] border-[#0A2854]'}`}>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-[#0067FC]"
            />
            <div className="text-left hidden md:block pr-2">
              <span className={`text-xs font-bold block leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{currentUser.name}</span>
              <span className="text-[10px] font-mono text-[#00A6FC]">{currentUser.userRole || 'COLABORADOR'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL DO HUB */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* BANNER DE BOAS-VINDAS HERO */}
        <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-[#0A2854] bg-gradient-to-br from-[#01122D] via-[#041838] to-[#011638] shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0067FC]/10 border border-[#0067FC]/30 text-[#00A6FC] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sessão Autenticada com Sucesso</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A6FC] to-[#0067FC]">{currentUser.name}</span>!
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Bem-vindo ao <strong>GIHS System</strong>. Selecione qualquer módulo abaixo para começar.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Setor: <strong>{currentUser.sector || 'Geral'}</strong>
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">
                Perfil: <strong>{currentUser.userRole || 'COLABORADOR'}</strong>
              </span>
              <span>•</span>
              <span className="text-[#00A6FC] font-semibold">
                {modules.length} Módulos Disponíveis
              </span>
            </div>
          </div>

          {/* Efeito luminoso de fundo */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0067FC]/20 to-transparent pointer-events-none" />
        </div>

        {/* BARRA DE PESQUISA & FILTRO POR CATEGORIA */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar módulo ou ferramenta (ex: Chamados, Ponto, Kanban, Frotas)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#01122D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            <span className="text-xs text-slate-400">
              Mostrando <strong>{filteredModules.length}</strong> de <strong>{modules.length}</strong> módulos
            </span>
          </div>

          {/* Abas de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0067FC] text-white shadow-lg shadow-[#0067FC]/30'
                    : 'bg-[#01122D] text-slate-400 hover:text-white hover:bg-[#041838] border border-[#0A2854]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* GRADE DE CARDS INTERATIVOS COM TODOS OS ÍCONES DA BARRA LATERAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredModules.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                style={{ backgroundColor: cardColor }}
                className={`text-left p-5 rounded-3xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:scale-[1.02] shadow-xl ${
                  highContrast
                    ? 'bg-black border-yellow-400 hover:bg-yellow-400/10'
                    : isCardLight
                    ? 'border-slate-200 text-slate-800 hover:shadow-2xl'
                    : 'border-[#0A2854] text-white hover:border-[#0067FC] hover:shadow-2xl hover:shadow-[#0067FC]/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
                      style={{
                        backgroundColor: `${item.accentColor}15`,
                        color: item.accentColor,
                        border: `1px solid ${item.accentColor}40`
                      }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#00A6FC] uppercase tracking-wider block font-bold">
                      {item.category}
                    </span>
                    <h3 className={`text-base font-bold group-hover:text-[#00A6FC] transition-colors mt-0.5 ${isCardLight ? 'text-slate-900' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    <p className={`text-[11px] font-medium ${isCardLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.subtitle}
                    </p>
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed ${isCardLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {item.description}
                  </p>
                </div>

                <div className={`pt-4 mt-4 border-t flex items-center justify-between text-xs transition-colors ${isCardLight ? 'border-slate-200 text-slate-500 group-hover:text-slate-900' : 'border-[#0A2854]/60 text-slate-400 group-hover:text-white'}`}>
                  <span className="font-semibold text-[11px]">Acessar Módulo</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isCardLight ? 'bg-slate-100 group-hover:bg-[#0067FC] text-slate-700 group-hover:text-white' : 'bg-[#041838] group-hover:bg-[#0067FC] text-slate-300 group-hover:text-white'}`}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};
