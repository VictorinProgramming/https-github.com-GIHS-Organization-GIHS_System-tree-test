import {
  Collaborator,
  CalendarEvent,
  Sector,
  UserRolePermissions,
  OrganizationalSector,
  MarketingVideoItem,
  ClientEntity,
  EquipmentItem
} from '../types';

export const ORGANIZATIONAL_AREAS = [
  'SUPORTE',
  'DESENVOLVIMENTO',
  'SEGURANÇA',
  'DADOS',
  'ADMINISTRATIVO'
];

export const INITIAL_ORGANIZATIONAL_SECTORS: OrganizationalSector[] = [
  { id: 'sec-1', name: 'N1', area: 'SUPORTE', leaderName: 'Líder Suporte N1', collaboratorsCount: 1, slaTarget: '99.0%', description: 'Triagem de chamados, primeiro contato e atendimento ao usuário' },
  { id: 'sec-2', name: 'N2', area: 'SUPORTE', leaderName: 'Líder Suporte N2', collaboratorsCount: 1, slaTarget: '97.5%', description: 'Resolução técnica avançada de redes, sistemas e SO' },
  { id: 'sec-3', name: 'N3', area: 'SUPORTE', leaderName: 'Líder Suporte N3', collaboratorsCount: 1, slaTarget: '98.5%', description: 'Infraestrutura crítica, switches core, telecom e escalonamentos' },
  { id: 'sec-4', name: 'Front-End', area: 'DESENVOLVIMENTO', leaderName: 'Líder Front-End', collaboratorsCount: 1, slaTarget: '99.5%', description: 'Aplicações web, interfaces do usuário, mobile e acessibilidade' },
  { id: 'sec-5', name: 'Back-End', area: 'DESENVOLVIMENTO', leaderName: 'Líder Back-End', collaboratorsCount: 1, slaTarget: '99.0%', description: 'Microsserviços, APIs REST/gRPC, integrações bancárias e mensageria' },
  { id: 'sec-6', name: 'Cyber Security', area: 'SEGURANÇA', leaderName: 'Líder Cyber Security', collaboratorsCount: 1, slaTarget: '99.9%', description: 'SOC, pentest, conformidade LGPD, resposta a incidentes e firewall' },
  { id: 'sec-7', name: 'DBA', area: 'DADOS', leaderName: 'Líder DBA', collaboratorsCount: 1, slaTarget: '99.8%', description: 'Bancos de dados relacionais e NoSQL, replicação, backups e otimização' },
  { id: 'sec-8', name: 'RH', area: 'ADMINISTRATIVO', leaderName: 'Líder RH', collaboratorsCount: 1, slaTarget: '99.0%', description: 'Recrutamento, departamento pessoal, benefícios e clima organizacional' },
  { id: 'sec-9', name: 'Financeiro', area: 'ADMINISTRATIVO', leaderName: 'Líder Financeiro', collaboratorsCount: 1, slaTarget: '99.5%', description: 'Contas a pagar/receber, conciliação e faturamento corporativo' },
  { id: 'sec-10', name: 'Gestão', area: 'ADMINISTRATIVO', leaderName: 'Victor (Master Admin)', collaboratorsCount: 1, slaTarget: '100%', description: 'Diretoria executiva, governança corporativa e planejamento estratégico' },
  { id: 'sec-11', name: 'Patrimônio', area: 'ADMINISTRATIVO', leaderName: 'Líder Patrimônio', collaboratorsCount: 1, slaTarget: '98.0%', description: 'Facilities, controle de equipamentos, etiquetas e contratos' }
];

export const ROLE_DEFINITIONS: UserRolePermissions[] = [
  {
    role: 'SUPER_ADMIN',
    label: 'SUPER ADMINISTRADOR',
    description: 'Acesso completo ao sistema e governança geral.',
    allowedActions: [
      'Visualizar todos os setores',
      'Criar usuários',
      'Editar usuários',
      'Bloquear usuários',
      'Criar setores',
      'Definir permissões',
      'Visualizar todos os Kanbans',
      'Visualizar todos os registros de ponto',
      'Acessar relatórios',
      'Acessar auditoria',
      'Configurar integrações',
      'Acessar configurações gerais'
    ]
  },
  {
    role: 'ADMINISTRATIVO',
    label: 'ADMINISTRATIVO',
    description: 'Responsável operacional e de suporte à gestão corporativa.',
    allowedActions: [
      'Cadastro de colaboradores',
      'Documentos corporativos',
      'Planilhas e relatórios operacionais',
      'Agenda e reuniões corporativas',
      'Controle de ponto eletrônico',
      'Relatórios administrativos',
      'Acompanhamento das equipes'
    ]
  },
  {
    role: 'GESTOR',
    label: 'GESTOR',
    description: 'Liderança setorial. Acompanha sua equipe técnica sem acesso irrestrito aos dados de outros setores.',
    allowedActions: [
      'Acompanhar sua equipe',
      'Tarefas da equipe',
      'Kanban do setor',
      'Produtividade setorial',
      'Agenda da equipe',
      'Registros de atividades do setor',
      'Indicadores de SLA do setor'
    ]
  },
  {
    role: 'COLABORADOR',
    label: 'COLABORADOR',
    description: 'Operação individual focada em suas demandas atribuídas.',
    allowedActions: [
      'Suas informações cadastrais',
      'Seu Kanban individual',
      'Suas tarefas atribuídas',
      'Suas atividades e apontamentos',
      'Seu registro de ponto eletrônico',
      'Sua agenda pessoal',
      'Informações compartilhadas pela equipe'
    ]
  }
];

export const SECTORS: Sector[] = [
  'Administrativo',
  'RH',
  'Financeiro',
  'Gestão',
  'Patrimônio',
  'N1',
  'N2',
  'N3',
  'Front-End',
  'Back-End',
  'DBA',
  'Cyber Security'
];

export const CURRENT_USER: Collaborator = {
  id: 'user-master-victor-hugo',
  name: 'Victor Hugo',
  role: 'Diretor Geral & Super Administrador Master',
  userRole: 'SUPER_ADMIN',
  area: 'GESTAO',
  sector: 'Gestão',
  email: 'victor.hugo@bycomp.com.br',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  status: 'Em atividade',
  currentTask: 'Governança Corporativa e Gestão Estratégica Global',
  phone: '(11) 98765-4321',
  admissionDate: '2021-01-10'
};

export const RECENT_ACTIVITIES: { time: string; text: string; sector: Sector; icon: string }[] = [
  { time: '08:00', text: 'Sessão administrativa iniciada', sector: 'Gestão', icon: 'shield' },
  { time: '08:15', text: 'Sincronização em tempo real do PostgreSQL ativa', sector: 'Gestão', icon: 'refresh-cw' },
  { time: '09:00', text: 'Fila de atendimento de Help Desk operando', sector: 'N1', icon: 'play' }
];

export const MOCK_ALERTS: { id: string; type: 'warning' | 'info'; text: string; time: string }[] = [
  { id: 'alt-1', type: 'info', text: 'Conexão com PostgreSQL ativa e autenticada', time: 'Em tempo real' },
  { id: 'alt-2', type: 'info', text: 'Base de Atividades integrada ao fechamento de chamados', time: 'Hoje' }
];

export const SECTOR_PRODUCTIVITY: {
  sector: string;
  tasksDone: number;
  inProgress: number;
  SLA: string;
  score: number;
}[] = [];

export const TASK_STATUS_BREAKDOWN: {
  name: string;
  count: number;
  color: string;
}[] = [];

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: 'Alinhamento Operacional Help Desk',
    time: '09:00 - 09:30',
    duration: '30m',
    date: '16/09/2026',
    sector: 'N1',
    type: 'Alinhamento',
    attendees: ['Victor (Master Admin)', 'Equipe Suporte'],
    location: 'Sala Virtual GIHS'
  },
  {
    id: 'ev-2',
    title: 'Reunião de Governança e Planejamento',
    time: '14:00 - 15:00',
    duration: '1h',
    date: '16/09/2026',
    sector: 'Gestão',
    type: 'Reunião',
    attendees: ['Victor (Master Admin)', 'Diretoria'],
    location: 'Conselho Diretoria GIHS'
  }
];

export const TIME_CARD_RECORDS: {
  date: string;
  entry: string;
  breakStart: string;
  breakEnd: string;
  exit: string;
  totalHours: string;
  balance: string;
}[] = [];

export const PONTO_ADMIN_ROWS: {
  id: string;
  name: string;
  sector: string;
  entry: string;
  exit: string;
  totalHours: string;
  status: string;
}[] = [];

export const AI_TOOLS_DATA: {
  id: string;
  title: string;
  category: string;
  description: string;
  badge: string;
  status: 'Ativo' | 'Em testes' | 'Planejado';
}[] = [];

export const MARKETING_VIDEOS_QUEUE: MarketingVideoItem[] = [];

export const SOCIAL_NETWORKS_STATUS: {
  name: string;
  account: string;
  followers: string;
  status: 'Conectado' | 'Pendente' | 'Desconectado';
}[] = [];

export const CLIENTS_DATA: ClientEntity[] = [];

export const EQUIPMENT_DATA: EquipmentItem[] = [];
