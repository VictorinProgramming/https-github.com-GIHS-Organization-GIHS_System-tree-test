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
  'PATRIMÔNIO',
  'BANCO DE DADOS (DBA)',
  'CYBER SECURITY',
  'ADMINISTRATIVO',
  'SUPORTE TÉCNICO',
  'DESENVOLVIMENTO',
  'FAZENDA & FINANÇAS',
  'SAÚDE',
  'EDUCAÇÃO',
  'MOBILIDADE URBANA',
  'GESTÃO MUNICIPAL'
];

export const INITIAL_ORGANIZATIONAL_SECTORS: OrganizationalSector[] = [
  // 1. PATRIMÔNIO (Prefeitura)
  { id: 'sec-patrim-1', name: 'Patrimônio', area: 'PATRIMÔNIO', leaderName: 'Líder Patrimônio Geral', collaboratorsCount: 4, slaTarget: '98.5%', description: 'Gestão geral de bens públicos, auditoria física e instalações' },
  { id: 'sec-patrim-2', name: 'Patrimônio - Tombamento & Cadastro', area: 'PATRIMÔNIO', leaderName: 'Coord. Tombamento', collaboratorsCount: 2, slaTarget: '99.0%', description: 'Registro de novos bens, plaqueteamento com código de barras e NFs' },
  { id: 'sec-patrim-3', name: 'Patrimônio - Transferência & Cautela', area: 'PATRIMÔNIO', leaderName: 'Coord. Cautela & Transferências', collaboratorsCount: 2, slaTarget: '98.0%', description: 'Termos de cautela de equipamentos, celulares corporativos e mudanças' },
  { id: 'sec-patrim-4', name: 'Patrimônio - Baixa & Descarte', area: 'PATRIMÔNIO', leaderName: 'Comissão de Inservibilidade', collaboratorsCount: 1, slaTarget: '97.0%', description: 'Laudos de inservibilidade, alienação, descarte sustentável e leilões' },
  { id: 'sec-patrim-5', name: 'Patrimônio - Inventário & Auditoria', area: 'PATRIMÔNIO', leaderName: 'Auditor Patrimonial', collaboratorsCount: 2, slaTarget: '99.0%', description: 'Inventário físico nas secretarias, conciliação e balanço anual' },
  { id: 'sec-patrim-6', name: 'Patrimônio - Mobiliário & Facilities', area: 'PATRIMÔNIO', leaderName: 'Supervisor de Facilities', collaboratorsCount: 3, slaTarget: '96.5%', description: 'Conserto de móveis, cadeiras, armários e adequação de layout físico' },

  // 2. BANCO DE DADOS (DBA)
  { id: 'sec-dba-1', name: 'DBA', area: 'BANCO DE DADOS (DBA)', leaderName: 'Líder DBA Master', collaboratorsCount: 3, slaTarget: '99.9%', description: 'Administração de instâncias PostgreSQL/Oracle, replicação e tuning' },
  { id: 'sec-dba-2', name: 'DBA - Backup & Disaster Recovery', area: 'BANCO DE DADOS (DBA)', leaderName: 'Especialista em Contingência', collaboratorsCount: 1, slaTarget: '99.99%', description: 'Rotinas automatizadas de backup, testes de restore e PITR' },
  { id: 'sec-dba-3', name: 'DBA - Performance & Tuning', area: 'BANCO DE DADOS (DBA)', leaderName: 'Senior Performance Engineer', collaboratorsCount: 2, slaTarget: '99.5%', description: 'Otimização de queries pesadas de IPTU, saúde e índices avançados' },
  { id: 'sec-dba-4', name: 'DBA - Modelagem & Migrações', area: 'BANCO DE DADOS (DBA)', leaderName: 'Arquiteto de Dados', collaboratorsCount: 1, slaTarget: '99.0%', description: 'DDL, schemas relacionais, constraints e versionamento de banco' },
  { id: 'sec-dba-5', name: 'DBA - Extração SQL & BI', area: 'BANCO DE DADOS (DBA)', leaderName: 'Analista de BI Municipal', collaboratorsCount: 2, slaTarget: '98.5%', description: 'Extrações para Tribunal de Contas, Transparência e relatórios analíticos' },

  // 3. CYBER SECURITY (Segurança da Informação & SOC)
  { id: 'sec-sec-1', name: 'Cyber Security', area: 'CYBER SECURITY', leaderName: 'CISO / Líder Cyber Security', collaboratorsCount: 3, slaTarget: '99.9%', description: 'Defesa cibernética municipal, SOC 24/7, firewall e conformidade LGPD' },
  { id: 'sec-sec-2', name: 'Cyber Security - SOC & Incidentes', area: 'CYBER SECURITY', leaderName: 'Líder SOC Municipal', collaboratorsCount: 2, slaTarget: '99.95%', description: 'Resposta rápida a incidentes, bloqueio de ameaças e contenção' },
  { id: 'sec-sec-3', name: 'Cyber Security - Gestão de Acessos & VPN', area: 'CYBER SECURITY', leaderName: 'Analista IAM & VPN', collaboratorsCount: 2, slaTarget: '99.0%', description: 'Autenticação multifator, gestão de privilégios e túneis VPN' },
  { id: 'sec-sec-4', name: 'Cyber Security - LGPD & Auditoria', area: 'CYBER SECURITY', leaderName: 'DPO / Encarregado LGPD', collaboratorsCount: 1, slaTarget: '98.5%', description: 'Conformidade da Lei Geral de Proteção de Dados e auditoria de trilhas' },
  { id: 'sec-sec-5', name: 'Cyber Security - Firewall & Borda', area: 'CYBER SECURITY', leaderName: 'Engenheiro de Redes Seguras', collaboratorsCount: 2, slaTarget: '99.8%', description: 'Firewalls pfSense/Fortigate, proteção perimetral e filtro proxy' },

  // 4. ADMINISTRAÇÃO MUNICIPAL
  { id: 'sec-adm-1', name: 'Administrativo', area: 'ADMINISTRATIVO', leaderName: 'Diretor Geral de Administração', collaboratorsCount: 5, slaTarget: '98.0%', description: 'Protocolo, recursos humanos, compras públicas e contratos contínuos' },
  { id: 'sec-adm-2', name: 'Administração - Protocolo & Processos', area: 'ADMINISTRATIVO', leaderName: 'Chefe de Protocolo', collaboratorsCount: 3, slaTarget: '99.0%', description: 'Abertura, tramitação eletrônica e numeração de processos oficiais' },
  { id: 'sec-adm-3', name: 'Administração - Recursos Humanos / DP', area: 'ADMINISTRATIVO', leaderName: 'Gerente de RH e Folha', collaboratorsCount: 4, slaTarget: '98.5%', description: 'Gestão de servidores, ponto eletrônico, férias, benefícios e holerites' },
  { id: 'sec-adm-4', name: 'Administração - Compras & Licitações', area: 'ADMINISTRATIVO', leaderName: 'Pregoeiro Oficial', collaboratorsCount: 3, slaTarget: '97.5%', description: 'Editais de licitação, pregões eletrônicos e termos de referência' },
  { id: 'sec-adm-5', name: 'Administração - Gestão de Contratos', area: 'ADMINISTRATIVO', leaderName: 'Fiscal de Contratos', collaboratorsCount: 2, slaTarget: '98.0%', description: 'Fiscalização de terceirizados, aditivos e atestados de execução' },
  { id: 'sec-adm-6', name: 'Administração - Almoxarifado Central', area: 'ADMINISTRATIVO', leaderName: 'Chefe de Almoxarifado', collaboratorsCount: 2, slaTarget: '98.0%', description: 'Controle e distribuição de materiais de consumo e suprimentos' },

  // 5. SUPORTE TÉCNICO (TI)
  { id: 'sec-sup-1', name: 'N1', area: 'SUPORTE TÉCNICO', leaderName: 'Líder Suporte N1', collaboratorsCount: 4, slaTarget: '99.0%', description: 'Triagem de chamados, primeiro contato, reset de senhas e impressoras' },
  { id: 'sec-sup-2', name: 'N2', area: 'SUPORTE TÉCNICO', leaderName: 'Líder Suporte N2', collaboratorsCount: 4, slaTarget: '97.5%', description: 'Diagnóstico de hardware, rede local, Wi-Fi e telefonia VoIP' },
  { id: 'sec-sup-3', name: 'N3', area: 'SUPORTE TÉCNICO', leaderName: 'Líder Suporte N3', collaboratorsCount: 3, slaTarget: '98.5%', description: 'Infraestrutura crítica, datacenter, virtualização e telecom core' },

  // 6. DESENVOLVIMENTO
  { id: 'sec-dev-1', name: 'Front-End', area: 'DESENVOLVIMENTO', leaderName: 'Líder Front-End', collaboratorsCount: 2, slaTarget: '99.5%', description: 'Portais públicos do cidadão, acessibilidade web e transparência' },
  { id: 'sec-dev-2', name: 'Back-End', area: 'DESENVOLVIMENTO', leaderName: 'Líder Back-End', collaboratorsCount: 2, slaTarget: '99.0%', description: 'APIs municipais, integrações Gov.br, e-SUS e regras tributárias' },

  // 7. FAZENDA, SAÚDE, EDUCAÇÃO & MOBILIDADE
  { id: 'sec-faz-1', name: 'Fazenda', area: 'FAZENDA & FINANÇAS', leaderName: 'Auditor Tributário Chefe', collaboratorsCount: 3, slaTarget: '98.5%', description: 'Tributação, IPTU, ISS, Nota Fiscal Eletrônica e contabilidade pública' },
  { id: 'sec-sau-1', name: 'Saúde', area: 'SAÚDE', leaderName: 'Coord. TI Saúde (SMS)', collaboratorsCount: 4, slaTarget: '99.5%', description: 'Prontuário eletrônico e-SUS, regulação de exames e informática em UPAs' },
  { id: 'sec-edu-1', name: 'Educação', area: 'EDUCAÇÃO', leaderName: 'Coord. Tecnologia SEMED', collaboratorsCount: 3, slaTarget: '98.0%', description: 'Sistemas de gestão escolar, diário digital e laboratórios de informática' },
  { id: 'sec-mob-1', name: 'Mobilidade Urbana', area: 'MOBILIDADE URBANA', leaderName: 'Diretor de Trânsito & Frota', collaboratorsCount: 3, slaTarget: '97.5%', description: 'Rastreamento veicular, autorização de frotas e fiscalização de trânsito' },
  { id: 'sec-ges-1', name: 'Gestão', area: 'GESTÃO MUNICIPAL', leaderName: 'Victor Hugo (Master Admin)', collaboratorsCount: 2, slaTarget: '100%', description: 'Diretoria executiva, gabinete do prefeito e governança institucional' }
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
  'Patrimônio',
  'DBA',
  'Cyber Security',
  'Administrativo',
  'N1',
  'N2',
  'N3',
  'Front-End',
  'Back-End',
  'Fazenda',
  'Saúde',
  'Educação',
  'Mobilidade Urbana',
  'Gestão'
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
