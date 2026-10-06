import { ViewScreen, UserRole, Collaborator } from '../types';

export interface UserCredentialAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  hierarchyLevel: number;
  sector: string;
  area: string;
  avatar: string;
  phone: string;
  admissionDate: string;
  status: 'Em atividade' | 'Intervalo' | 'Ausente' | 'Férias' | 'Bloqueado';
  currentTask: string;
  description: string;
  allowedScreensCount: number;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  keyPermissions: string[];
}

export const USER_CREDENTIALS: UserCredentialAccount[] = [
  {
    id: 'user-master-victor-hugo',
    name: 'Victor Hugo',
    email: 'victor.hugo@bycomp.com.br',
    password: '842867@Victor',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMINISTRADOR MASTER',
    hierarchyLevel: 1,
    sector: 'Gestão Executiva',
    area: 'GESTAO',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4321',
    admissionDate: '2021-01-10',
    status: 'Em atividade',
    currentTask: 'Governança Corporativa e Gestão Estratégica Global',
    description: 'Diretor Geral e Super Administrador Master com acesso irrestrito a 100% dos módulos e controle do PostgreSQL.',
    allowedScreensCount: 28,
    badgeStyle: {
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-700/80'
    },
    keyPermissions: [
      'Acesso total e irrestrito (Master Super Admin)',
      'Visualizar e gerenciar todos os setores organizacionais',
      'Cadastro e validação de biometria facial para ponto',
      'Controle oficial do Banco de Dados PostgreSQL',
      'Acesso à Trilha de Auditoria e Logs de Conformidade',
      'Visualização e aprovação de todos os Kanbans e chamados',
      'Gestão global de ponto e espelhos de registro eletrônico'
    ]
  },
  {
    id: 'user-master-rebeca',
    name: 'Rebeca',
    email: 'rebeca@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMINISTRADORA MASTER',
    hierarchyLevel: 1,
    sector: 'Gestão Executiva',
    area: 'GESTAO',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4322',
    admissionDate: '2021-02-15',
    status: 'Em atividade',
    currentTask: 'Gestão Executiva de Operações e Governança GIHS',
    description: 'Diretora Executiva e Super Administradora Master com autoridade máxima de governança.',
    allowedScreensCount: 28,
    badgeStyle: {
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-700/80'
    },
    keyPermissions: [
      'Acesso total e irrestrito (Master Super Admin)',
      'Governança executiva de RH, Ponto e Colaboradores',
      'Auditoria de conformidade e integridade',
      'Aprovação orçamentária e contratos corporativos'
    ]
  },
  {
    id: 'user-master-victor-martins',
    name: 'Victor Martins',
    email: 'Victor.martins@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMINISTRADOR MASTER',
    hierarchyLevel: 1,
    sector: 'Gestão Executiva',
    area: 'GESTAO',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4323',
    admissionDate: '2021-03-20',
    status: 'Em atividade',
    currentTask: 'Supervisão Arquitetural de Engenharia e Segurança',
    description: 'Tech Lead Executivo e Super Administrador Master com governança técnica integral.',
    allowedScreensCount: 28,
    badgeStyle: {
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-700/80'
    },
    keyPermissions: [
      'Acesso total e irrestrito (Master Super Admin)',
      'Controle arquitetural do banco PostgreSQL e APIs',
      'Gestão de infraestrutura crítica N1/N2/N3 e cibersegurança'
    ]
  },
  {
    id: 'user-master-matheus',
    name: 'Matheus',
    email: 'Matheus@bycomp.com.br',
    password: 'Bycomp@2026',
    role: 'SUPER_ADMIN',
    roleLabel: 'SUPER ADMINISTRADOR MASTER',
    hierarchyLevel: 1,
    sector: 'Gestão Executiva',
    area: 'GESTAO',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '(11) 98765-4324',
    admissionDate: '2021-04-01',
    status: 'Em atividade',
    currentTask: 'Governança de IA, Dados e Plataformas Corporativas',
    description: 'Head de Inteligência e Super Administrador Master com governança de agentes e analytics.',
    allowedScreensCount: 28,
    badgeStyle: {
      bg: 'bg-purple-950/80',
      text: 'text-purple-300',
      border: 'border-purple-700/80'
    },
    keyPermissions: [
      'Acesso total e irrestrito (Master Super Admin)',
      'Governança de IA Agents e automação',
      'Analytics de performance e monitoramento'
    ]
  }
];

export interface ScreenSecurityPolicy {
  screen: ViewScreen;
  screenTitle: string;
  category: string;
  allowedRoles: UserRole[];
  restrictionReason: string;
  recommendedRoleToTest: UserRole;
}

export const SCREEN_SECURITY_POLICIES: Record<ViewScreen, ScreenSecurityPolicy> = {
  login: {
    screen: 'login',
    screenTitle: 'Autenticação & Login',
    category: 'SISTEMA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Tela pública de autenticação para todos os colaboradores.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  },
  home: {
    screen: 'home',
    screenTitle: 'Home • Hub de Acesso Geral',
    category: 'INÍCIO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Página inicial com todos os módulos do sistema.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  },
  dashboard: {
    screen: 'dashboard',
    screenTitle: 'Dashboard Corporativo',
    category: 'VISÃO GERAL',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Visão executiva contextualizada para o nível do usuário.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  },
  organograma: {
    screen: 'organograma',
    screenTitle: 'Fase 3 • Organograma Institucional (Área Privada: Gestão, Adm & RH)',
    category: 'FASE 3 • PRIVADA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'],
    restrictionReason: 'Área Privada Corporativa (Fase 3): Acesso confidencial e restrito exclusivamente à Gestão, Administração e Recursos Humanos (RH) do GIHS System. A visualização de linhas de comando de subordinação, metas de SLA e reestruturação de setores é vedada a colaboradores operacionais.',
    recommendedRoleToTest: 'GESTOR'
  },
  colaboradores: {
    screen: 'colaboradores',
    screenTitle: 'Fase 4 • Colaboradores (Área Privada: Gestão, Adm & RH)',
    category: 'FASE 4 • PRIVADA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'],
    restrictionReason: 'Área Privada Corporativa (Fase 4): Acesso confidencial e restrito exclusivamente à Gestão, Administração e Recursos Humanos (RH) do GIHS System em conformidade com as diretrizes internas e a LGPD. Colaboradores operacionais não possuem permissão para visualizar o dossiê cadastral, contratos e quadro de pessoal.',
    recommendedRoleToTest: 'ADMINISTRATIVO'
  },
  chamados: {
    screen: 'chamados',
    screenTitle: 'Help Desk & Chamados',
    category: 'OPERAÇÃO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Aberto para atendimento operacional, triagem e resolução de tickets de suporte.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  meu_kanban: {
    screen: 'meu_kanban',
    screenTitle: 'Meu Kanban Pessoal',
    category: 'OPERAÇÃO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Espaço individual de execução de tarefas atribuídas ao colaborador.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  kanban_equipe: {
    screen: 'kanban_equipe',
    screenTitle: 'Kanban da Equipe Técnica',
    category: 'GESTÃO & LIDERANÇA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'],
    restrictionReason: 'Acesso restrito exclusivamente aos maiores cargos (Diretoria Executiva, Tech Leads, Gestores e Líderes de Setor). Colaboradores operacionais possuem acesso individualizado ao "Meu Kanban".',
    recommendedRoleToTest: 'GESTOR'
  },
  visao_semanal: {
    screen: 'visao_semanal',
    screenTitle: 'Meu Planejamento Semanal',
    category: 'OPERAÇÃO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Planejamento semanal individual de atividades distribuídas por dia.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  sobreaviso: {
    screen: 'sobreaviso',
    screenTitle: 'Escala de Sobreaviso & Plantão',
    category: 'OPERAÇÃO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Planejamento e visualização das escalas de sobreaviso e plantões operacionais.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  planilhas: {
    screen: 'planilhas',
    screenTitle: 'Base de Atividades & Planilhas',
    category: 'OPERAÇÃO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Base de apontamento de atividades, horas trabalhadas e exportação Excel.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  registro_ponto: {
    screen: 'registro_ponto',
    screenTitle: 'Registro de Ponto Eletrônico',
    category: 'PESSOAS & PONTO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Módulo universal de registro biométrico e geolocalizado de jornada de trabalho.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  espelho_ponto: {
    screen: 'espelho_ponto',
    screenTitle: 'Espelho de Ponto Individual',
    category: 'PESSOAS & PONTO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Consulta ao histórico pessoal de batidas e saldo de banco de horas.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  gestao_ponto: {
    screen: 'gestao_ponto',
    screenTitle: 'Gestão de Ponto Geral (Admin)',
    category: 'PESSOAS & PONTO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO'],
    restrictionReason: 'O painel corporativo de aprovação, espelhos de todos os 48 colaboradores e controle de horas extras é restrito ao Administrativo/RH e Super Admin.',
    recommendedRoleToTest: 'ADMINISTRATIVO'
  },
  agenda: {
    screen: 'agenda',
    screenTitle: 'Agenda & Reuniões',
    category: 'PESSOAS & PONTO',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Agenda institucional e reuniões setoriais abertas a todos os colaboradores.',
    recommendedRoleToTest: 'COLABORADOR'
  },
  clientes: {
    screen: 'clientes',
    screenTitle: 'Gestão de Clientes',
    category: 'COMERCIAL & ATIVOS',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'],
    restrictionReason: 'Carteira de clientes B2B e contratos atendidos por Gestores e Administrativo.',
    recommendedRoleToTest: 'ADMINISTRATIVO'
  },
  equipamentos: {
    screen: 'equipamentos',
    screenTitle: 'Equipamentos & Hardware TI',
    category: 'COMERCIAL & ATIVOS',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Controle de patrimônio de infraestrutura, switches e servidores reservado a Gestores, Administrativo e equipe de Patrimônio.',
    recommendedRoleToTest: 'GESTOR'
  },
  relatorios: {
    screen: 'relatorios',
    screenTitle: 'Central de Relatórios',
    category: 'GOVERNANÇA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'],
    restrictionReason: 'Relatórios consolidados de SLA, chamados e produtividade gerencial.',
    recommendedRoleToTest: 'GESTOR'
  },
  mobilidade: {
    screen: 'mobilidade',
    screenTitle: 'Mobilidade Corporativa & Rastreamento',
    category: 'GOVERNANÇA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: 'Gestão de celulares corporativos, custódia de aparelhos, viagens e telemetria GPS.',
    recommendedRoleToTest: 'GESTOR'
  },
  auditoria: {
    screen: 'auditoria',
    screenTitle: 'Auditoria do Sistema (Logs)',
    category: 'GOVERNANÇA',
    allowedRoles: ['SUPER_ADMIN'],
    restrictionReason: 'A Trilha de Auditoria com registros criptográficos, IPs, logins e integridade é de acesso EXCLUSIVO do SUPER ADMINISTRADOR.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  },
  configuracoes: {
    screen: 'configuracoes',
    screenTitle: 'Configurações de TI',
    category: 'GOVERNANÇA',
    allowedRoles: ['SUPER_ADMIN'],
    restrictionReason: 'Parâmetros de infraestrutura, portas de rede, chaves de API e variáveis de ambiente são de acesso EXCLUSIVO do SUPER ADMINISTRADOR.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  },
  inventario_ti: {
    screen: 'inventario_ti',
    screenTitle: 'Inventário de TI (Agente Windows)',
    category: 'COMERCIAL & ATIVOS',
    allowedRoles: ['SUPER_ADMIN'],
    restrictionReason: 'O Painel de Inventário Automatizado e Telemetria de Agentes Windows é de acesso EXCLUSIVO do SUPER ADMINISTRADOR.',
    recommendedRoleToTest: 'SUPER_ADMIN'
  }
};

/**
 * Determines whether a collaborator holds a higher rank / leadership position
 * (Diretoria Executiva, Tech Lead, Gestão, Coordenação ou Liderança de Setor).
 */
export function isLeadershipOrHigherRole(user?: Collaborator | Partial<Collaborator>): boolean {
  if (!user) return false;
  const role = (user.userRole || '').toUpperCase();
  if (role === 'SUPER_ADMIN' || role === 'ADMINISTRATIVO' || role === 'GESTOR') {
    return true;
  }
  if (user.hierarchyLevel !== undefined && user.hierarchyLevel <= 2) {
    return true;
  }
  const jobTitle = (user.role || '').toLowerCase();
  const leaderKeywords = [
    'líder', 'lider', 'coordenador', 'coordenadora', 'gerente',
    'diretor', 'diretora', 'gestor', 'gestora', 'head', 'tech lead',
    'supervisor', 'supervisora', 'lead', 'chief'
  ];
  if (leaderKeywords.some(k => jobTitle.includes(k))) {
    return true;
  }
  const sector = (user.sector || '').toLowerCase();
  if (sector.includes('gest') || sector.includes('diret') || sector.includes('coord')) {
    return true;
  }
  return false;
}

export function checkScreenAccess(
  screen: ViewScreen,
  userRole?: UserRole,
  collaborator?: Collaborator
): {
  allowed: boolean;
  policy: ScreenSecurityPolicy;
} {
  const policy = SCREEN_SECURITY_POLICIES[screen] || {
    screen,
    screenTitle: screen,
    category: 'SISTEMA',
    allowedRoles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'],
    restrictionReason: '',
    recommendedRoleToTest: 'SUPER_ADMIN' as UserRole
  };

  // Proteção em duas camadas: Tela inventario_ti é estritamente restrita a SUPER_ADMIN
  if (screen === 'inventario_ti') {
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    return {
      allowed: isSuperAdmin,
      policy
    };
  }

  // Libera o acesso irrestrito a todos os utilizadores e papéis
  const allowed = true;

  return { allowed, policy };
}

export function convertCredentialToCollaborator(account: UserCredentialAccount): Collaborator {
  return {
    id: account.id,
    name: account.name,
    role: account.roleLabel,
    userRole: account.role,
    sector: account.sector,
    area: account.area,
    email: account.email,
    avatar: account.avatar,
    phone: account.phone,
    admissionDate: account.admissionDate,
    status: account.status,
    currentTask: account.currentTask
  };
}

export const AUTH_ACCOUNTS = USER_CREDENTIALS;
