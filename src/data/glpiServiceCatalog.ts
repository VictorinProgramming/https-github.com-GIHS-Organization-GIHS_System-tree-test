/**
 * Catálogo Municipal de Serviços e Classificações GLPI
 * Baseado no modelo Central de Serviços Municipal / GLPI (Prefeitura Municipal de Joinville - PMJ)
 * Abrange TODOS os setores da Prefeitura: Patrimônio, DBA, Cyber Security, Administração, TI (N1, N2, N3, Dev),
 * Fazenda, Saúde, Educação e Mobilidade Urbana.
 */

export interface GLPIServiceCategory {
  id: string;
  name: string;
  description: string;
  defaultSlaHours: number;
}

export interface GLPISectorCatalog {
  sector: string;
  label: string;
  area: 'PATRIMÔNIO' | 'BANCO DE DADOS' | 'CYBER SECURITY' | 'ADMINISTRATIVO' | 'SUPORTE' | 'DESENVOLVIMENTO' | 'FAZENDA' | 'SAÚDE' | 'EDUCAÇÃO' | 'MOBILIDADE' | string;
  description: string;
  services: GLPIServiceCategory[];
}

export const GLPI_SECTORS_CATALOG: Record<string, GLPISectorCatalog> = {
  // ==========================================
  // 1. PATRIMÔNIO (TODOS OS SETORES DE PATRIMÔNIO)
  // ==========================================
  'Patrimônio': {
    sector: 'Patrimônio',
    label: 'Patrimônio & Gestão de Bens Públicos',
    area: 'PATRIMÔNIO',
    description: 'Gestão patrimonial completa, tombamento, transferências de bens, descarte e auditoria municipal',
    services: [
      { id: 'Tombamento e Cadastro', name: 'Patrimônio (Tombamento & Cadastro de Novos Bens)', description: 'Registro no sistema patrimonial, conferência de nota fiscal e emissão de placas de patrimônio com código de barras', defaultSlaHours: 24 },
      { id: 'Transferência e Cautela', name: 'Patrimônio (Transferência de Setor & Termo de Cautela)', description: 'Movimentação física de bens entre secretarias, termos de responsabilidade de equipamentos e celulares corporativos', defaultSlaHours: 8 },
      { id: 'Baixa e Descarte', name: 'Patrimônio (Baixa Patrimonial, Inservibilidade & Leilão)', description: 'Abertura de laudo técnico de inservibilidade, alienação, desfazimento sustentável e preparação para leilão público', defaultSlaHours: 48 },
      { id: 'Inventário e Auditoria', name: 'Patrimônio (Inventário Físico & Auditoria Periódica)', description: 'Conferência física anual por sala/secretaria, conciliação com o balanço patrimonial e apuração de divergências', defaultSlaHours: 72 },
      { id: 'Manutenção de Mobiliário', name: 'Patrimônio (Reparo de Mobiliário & Facilities)', description: 'Conserto de mesas, gaveteiros, armários de aço, cadeiras ergonômicas e adequação de layout físico', defaultSlaHours: 12 },
      { id: 'Vistoria e Sinistros', name: 'Patrimônio (Vistoria Técnica & Registro de Avarias/Sinistros)', description: 'Vistoria presencial em prédios municipais, perícia de danos e acionamento de seguro de bens públicos', defaultSlaHours: 16 }
    ]
  },

  // ==========================================
  // 2. DBA (BANCO DE DADOS MUNICIPAL)
  // ==========================================
  'DBA': {
    sector: 'DBA',
    label: 'DBA • Banco de Dados, Analytics & BI',
    area: 'BANCO DE DADOS',
    description: 'Administração de instâncias PostgreSQL/Oracle/SQL Server da Prefeitura, replicação, backups e tunings',
    services: [
      { id: 'Backup e Disaster Recovery', name: 'DBA (Rotinas de Backup, Restauração & Disaster Recovery)', description: 'Testes de integridade, restauração pontual (PITR), planos de continuidade de negócios e contingência', defaultSlaHours: 2 },
      { id: 'Otimização e Tuning', name: 'DBA (Performance, Tuning de Queries & Criação de Índices)', description: 'Análise de slow queries em sistemas de IPTU/Saúde, explain analyze, reindex, vacuum e otimização de buffer pool', defaultSlaHours: 4 },
      { id: 'Modelagem e Migrações', name: 'DBA (Modelagem de Dados, Schemas & Migrations DDL)', description: 'Criação de novas tabelas, alteração de colunas, constraints, versionamento de schemas e migrações estruturais', defaultSlaHours: 6 },
      { id: 'Replicação e Alta Disponibilidade', name: 'DBA (Replicação Síncrona/Assíncrona & Failover de Cluster)', description: 'Monitoramento de delay de replicação, nós standby, balanceamento de leitura com PgPool/Patroni e alta disponibilidade', defaultSlaHours: 2 },
      { id: 'Extração e Auditoria de Dados', name: 'DBA (Extrações SQL para TCE, Portal da Transparência & BI)', description: 'Consultas complexas para órgãos de controle, relatórios gerenciais analíticos e saneamento de bases de dados', defaultSlaHours: 8 },
      { id: 'Gestão de Acessos e Privilégios BD', name: 'DBA (Gestão de Usuários, Roles & Segurança de Banco)', description: 'Concessão de privilégios com menor privilégio (RBAC), revogação de acessos e auditoria de conexões', defaultSlaHours: 4 }
    ]
  },

  // ==========================================
  // 3. CYBER SECURITY (SEGURANÇA DA INFORMAÇÃO)
  // ==========================================
  'Cyber Security': {
    sector: 'Cyber Security',
    label: 'Cyber Security • Segurança da Informação & SOC Municipal',
    area: 'CYBER SECURITY',
    description: 'Defesa cibernética municipal, firewall de borda, SOC, conformidade LGPD, controle de acessos e VPN',
    services: [
      { id: 'Gestão de Acessos e Privilégios', name: 'Cyber Security (Gestão de Acessos, Credenciais & VPN Segura)', description: 'Criação e revogação de acessos de servidores, autenticação multifator (MFA), chaves SSH e túneis VPN seguros', defaultSlaHours: 2 },
      { id: 'Resposta a Incidentes SOC', name: 'Cyber Security (Resposta a Incidentes, Phishing & Mitigação SOC)', description: 'Bloqueio imediato de contas comprometidas, contenção de ransomware, análise de tráfego anômalo e forense digital', defaultSlaHours: 1 },
      { id: 'Conformidade LGPD e Auditoria', name: 'Cyber Security (Conformidade LGPD & Proteção de Dados do Cidadão)', description: 'Auditoria de vazamentos, resposta a solicitações de titulares, RIPD e aplicação de políticas de privacidade', defaultSlaHours: 12 },
      { id: 'Varredura de Vulnerabilidades', name: 'Cyber Security (Análise de Vulnerabilidades, CVEs & Pentest)', description: 'Scans periódicos em servidores da prefeitura, testes de invasão e aplicação de patches críticos de segurança', defaultSlaHours: 24 },
      { id: 'Firewall e Redes Seguras', name: 'Cyber Security (Regras de Firewall, Proxy & Filtro de Conteúdo Web)', description: 'Liberação de portas e rotas em firewall pfSense/Fortigate, proteção de borda e filtragem web setorial', defaultSlaHours: 2 },
      { id: 'Políticas e Certificados Digitais', name: 'Cyber Security (Certificados SSL/ICP-Brasil & Políticas Institucionais)', description: 'Emissão e renovação de certificados para domínios municipais, VPN de secretarias e normativas de segurança', defaultSlaHours: 8 }
    ]
  },

  // ==========================================
  // 4. ADMINISTRAÇÃO (GESTÃO PÚBLICA, RH, COMPRAS & SERVIÇOS GERAIS)
  // ==========================================
  'Administrativo': {
    sector: 'Administrativo',
    label: 'Administrativo • Gestão Pública, RH, Compras & Suprimentos',
    area: 'ADMINISTRATIVO',
    description: 'Protocolo geral de processos, departamento de pessoas, compras públicas, contratos e suprimentos',
    services: [
      { id: 'Protocolo Geral e Processos', name: 'Administração (Protocolo Geral & Tramitação de Processos Digitais)', description: 'Abertura, juntada de documentos, redistribuição de processos eletrônicos e numeração de atos oficiais', defaultSlaHours: 8 },
      { id: 'Recursos Humanos e Ponto', name: 'Administração (Recursos Humanos, Ponto Eletrônico & Folha)', description: 'Espelho de ponto, atestados médicos, férias, solicitações de benefícios e certidões funcionais de servidores', defaultSlaHours: 8 },
      { id: 'Compras e Licitações', name: 'Administração (Compras Públicas, Licitações & Pregões Eletrônicos)', description: 'Termos de referência, cotações de preços, acompanhamento de editais e requisições formais de compra', defaultSlaHours: 24 },
      { id: 'Gestão de Contratos', name: 'Administração (Gestão & Fiscalização de Contratos Continuados)', description: 'Acompanhamento de vigência, reajustes, atestados de capacidade técnica e fiscalização de prestadores terceirizados', defaultSlaHours: 16 },
      { id: 'Almoxarifado e Suprimentos', name: 'Administração (Almoxarifado Central & Requisição de Materiais)', description: 'Solicitação de materiais de expediente, insumos de impressão, toner, papelaria e conferência de estoque', defaultSlaHours: 12 },
      { id: 'Manutenção Predial e Zeladoria', name: 'Administração (Manutenção Predial, Elétrica, Hidráulica & Zeladoria)', description: 'Reparos de lâmpadas, climatização/ar condicionado, fechaduras, desentupimento e limpeza predial', defaultSlaHours: 8 }
    ]
  },

  // ==========================================
  // 5. TI • SUPORTE N1 (TRIAGEM & SERVIDORES)
  // ==========================================
  'N1': {
    sector: 'N1',
    label: 'Suporte N1 • Triagem & Atendimento ao Servidor Público',
    area: 'SUPORTE',
    description: 'Primeiro nível de atendimento, resolução imediata, reset de senhas institucionais e triagem rápida',
    services: [
      { id: 'Suporte N1 - Triagem e Reset de Senha', name: 'Suporte N1 (Triagem, Reset de Senha & Acesso à Central)', description: 'Desbloqueio de usuário do domínio municipal, reset de senha de e-mail institucional e orientação inicial', defaultSlaHours: 1 },
      { id: 'Suporte N1 - Periféricos e Impressão', name: 'Suporte N1 (Impressão em Rede, Monitores & Periféricos)', description: 'Mapeamento de impressoras departamentais, substituição de teclado/mouse e configuração de monitores', defaultSlaHours: 2 },
      { id: 'Suporte N1 - Navegadores e Softwares', name: 'Suporte N1 (Softwares Básicos, LibreOffice & Leitores PDF)', description: 'Instalação e atualização de navegadores padrão, navegadores seguros, Java para certidões e softwares de escritório', defaultSlaHours: 2 }
    ]
  },

  // ==========================================
  // 6. TI • SUPORTE N2 (HARDWARE, REDES & TELEFONIA)
  // ==========================================
  'N2': {
    sector: 'N2',
    label: 'Suporte N2 • Hardware, Redes Locais & Telefonia IP',
    area: 'SUPORTE',
    description: 'Diagnóstico presencial/remoto de estações de trabalho, cabeamento estruturado, Wi-Fi e VoIP',
    services: [
      { id: 'Suporte N2 - Hardware e Estações', name: 'Suporte N2 (Manutenção de Computadores, SSD & Sistema Operacional)', description: 'Formatação padronizada, clonagem de imagem municipal, troca de placa-mãe, fonte e resolução de telas azuis', defaultSlaHours: 4 },
      { id: 'Suporte N2 - Redes Locais e Wi-Fi', name: 'Suporte N2 (Pontos de Rede, Conectorização & Wi-Fi PMJ)', description: 'Testes de cabos RJ45, crimpagem, configuração de Access Points departamentais e liberação de MAC', defaultSlaHours: 4 },
      { id: 'Suporte N2 - Telefonia IP e VoIP', name: 'Suporte N2 (Telefonia IP, Ramais VoIP & Aparelhos SIP)', description: 'Configuração de ramal digital para servidores, redirecionamento de chamadas e manutenção de aparelhos IP', defaultSlaHours: 4 },
      { id: 'Suporte N2 - Sistemas Setoriais', name: 'Suporte N2 (Instalação e Configuração de Softwares Municipais)', description: 'Instalação de clientes ERP da Fazenda, Saúde, Educação, emuladores e tokens de certificação A1/A3', defaultSlaHours: 3 }
    ]
  },

  // ==========================================
  // 7. TI • INFRAESTRUTURA N3 (DATACENTER, CLOUD & CORE)
  // ==========================================
  'N3': {
    sector: 'N3',
    label: 'Suporte N3 • Datacenter, Servidores, Core & Telecom',
    area: 'SUPORTE',
    description: 'Engenharia de infraestrutura crítica, virtualização de servidores, anel óptico e alta disponibilidade',
    services: [
      { id: 'Suporte N3 - Especialistas e Escalação', name: 'Suporte N3 (Engenharia de Suporte & Escalação Crítica)', description: 'Incidentes de alta severidade com paralisação de serviços públicos municipais', defaultSlaHours: 2 },
      { id: 'Infraestrutura N3 - Servidores e Cloud', name: 'Infraestrutura N3 (Datacenter, Virtualização Proxmox/VMware & Storage)', description: 'Provisionamento de máquinas virtuais, balanceamento de carga, monitoramento de storages SAN e nuvem', defaultSlaHours: 2 },
      { id: 'Redes N3 - Roteamento Core e BGP', name: 'Redes N3 (Switches Core, BGP, Anel Óptico & Fibra Municipal)', description: 'Roteamento do anel de fibra da cidade, contingência de links dedicados, BGP e switches de agregação', defaultSlaHours: 2 },
      { id: 'Governança TI N3 - Gestão de Serviços', name: 'Governança TI N3 (COBIT, ITIL, Gestão de Capacidade & SLA)', description: 'Auditoria de catálogos de serviços municipais, cumprimento de SLAs contratuais e governança pública', defaultSlaHours: 8 }
    ]
  },

  // ==========================================
  // 8. DESENVOLVIMENTO • FRONT-END & PORTAL DO CIDADÃO
  // ==========================================
  'Front-End': {
    sector: 'Front-End',
    label: 'Front-End • Portais do Cidadão, Transparência & Web',
    area: 'DESENVOLVIMENTO',
    description: 'Interfaces web públicas municipais, acessibilidade digital, formulários de autosserviço e portais',
    services: [
      { id: 'Portal do Cidadão e Usabilidade', name: 'Front-End (Portais do Cidadão, Transparência & Autosserviço)', description: 'Melhorias de usabilidade no portal da prefeitura, acessibilidade para deficientes (e-MAG) e e-SIC', defaultSlaHours: 8 },
      { id: 'Interfaces Web e Correções Visuais', name: 'Front-End (Formulários Digitais, Emissão de Guias & Telas Web)', description: 'Correções visuais em páginas responsivas, validação de formulários de inscrição e telas de agendamento', defaultSlaHours: 6 }
    ]
  },

  // ==========================================
  // 9. DESENVOLVIMENTO • BACK-END & APIS GOVERNAMENTAIS
  // ==========================================
  'Back-End': {
    sector: 'Back-End',
    label: 'Back-End • Microsserviços, Regras de Negócio & Integrações',
    area: 'DESENVOLVIMENTO',
    description: 'Integrações seguras com bases federais/estaduais, microsserviços e motores de regras tributárias',
    services: [
      { id: 'APIs e Integrações Governamentais', name: 'Back-End (APIs Governamentais - Gov.br, e-SUS, SEI & Receita)', description: 'Integração de barramentos de serviços públicos federais e estaduais com autenticação única', defaultSlaHours: 6 },
      { id: 'Regras de Negócio e Serviços Web', name: 'Back-End (Microsserviços de Cobrança, IPTU/ISS & Filas Digitais)', description: 'Lógica transacional, cálculo automatizado de tributos municipais e fila de mensageria assíncrona', defaultSlaHours: 8 }
    ]
  },

  // ==========================================
  // 10. FAZENDA E FINANÇAS MUNICIPAIS
  // ==========================================
  'Fazenda': {
    sector: 'Fazenda',
    label: 'Fazenda • Tributação, IPTU, ISS & Contabilidade Pública',
    area: 'FAZENDA',
    description: 'Sistemas de arrecadação municipal, fiscalização tributária, certidões negativas e finanças',
    services: [
      { id: 'IPTU e Cadastro Imobiliário', name: 'Fazenda (Lançamentos de IPTU, Revisão Cadastral & Certidões)', description: 'Ajuste de cadastro imobiliário, certidão negativa de débitos (CND) e emissão de guias de pagamento', defaultSlaHours: 12 },
      { id: 'ISS e Nota Fiscal Eletrônica', name: 'Fazenda (Nota Fiscal de Serviços Eletrônica NFS-e & Declarações)', description: 'Homologação de sistemas emissores de NFS-e, cruzamento de dados fiscais e cadastros de prestadores', defaultSlaHours: 8 },
      { id: 'Contabilidade e Execução Orçamentária', name: 'Fazenda (Empenhos, Liquidações & Prestação de Contas)', description: 'Sistemas contábeis municipais, encerramento de exercício e envio de balanços para o Tribunal de Contas', defaultSlaHours: 16 }
    ]
  },

  // ==========================================
  // 11. SAÚDE PÚBLICA (SECRETARIA MUNICIPAL DE SAÚDE - SMS)
  // ==========================================
  'Saúde': {
    sector: 'Saúde',
    label: 'Saúde • Prontuário e-SUS, Regulação & UPAs/UBSs',
    area: 'SAÚDE',
    description: 'Apoio aos sistemas de atendimento da rede municipal de saúde, farmácia básica e leitos',
    services: [
      { id: 'Prontuário Eletrônico e-SUS', name: 'Saúde (Prontuário Eletrônico do Cidadão - PEC e-SUS)', description: 'Suporte ao sistema de atendimento médico, agendamento de consultas nas UBSs e registro clínico', defaultSlaHours: 2 },
      { id: 'Regulação de Consultas e Exames', name: 'Saúde (Central de Regulação de Vagas, Exames & Leitos)', description: 'Fila de espera de especialidades médicas, autorização de exames de alta complexidade e regulação', defaultSlaHours: 2 },
      { id: 'Informática Hospitalar e UPAs', name: 'Saúde (Infraestrutura de TI em UPAs, Pronto-Atendimentos & SAMU)', description: 'Garantia de funcionamento de computadores da triagem Manchester e salas de emergência 24h', defaultSlaHours: 1 }
    ]
  },

  // ==========================================
  // 12. EDUCAÇÃO MUNICIPAL (SEMED)
  // ==========================================
  'Educação': {
    sector: 'Educação',
    label: 'Educação • Gestão Escolar, Matrículas & Conectividade',
    area: 'EDUCAÇÃO',
    description: 'Sistemas pedagógicos, chamada eletrônica, matrículas da rede pública e laboratórios de informática',
    services: [
      { id: 'Gestão Escolar e Diário de Classe', name: 'Educação (Sistema de Gestão Escolar, Notas & Frequência)', description: 'Lançamento de diário eletrônico por professores, registros pedagógicos e histórico escolar', defaultSlaHours: 4 },
      { id: 'Fila Única e Matrículas', name: 'Educação (Matrículas Online da Rede Municipal & Fila Única CEI)', description: 'Abertura de vagas para creches e escolas fundamentais, classificação por critérios sociais e transferências', defaultSlaHours: 6 },
      { id: 'Laboratórios e Rede Escolar', name: 'Educação (Laboratórios de Informática & Conectividade nas Escolas)', description: 'Manutenção de Chromebooks, tablets educacionais e roteamento Wi-Fi em salas de aula públicas', defaultSlaHours: 8 }
    ]
  },

  // ==========================================
  // 13. MOBILIDADE URBANA & TRÂNSITO (DETRANS)
  // ==========================================
  'Mobilidade Urbana': {
    sector: 'Mobilidade Urbana',
    label: 'Mobilidade • Trânsito, Frota Municipal & Sinalização',
    area: 'MOBILIDADE',
    description: 'Gestão da frota pública, rastreamento de viaturas, semáforos inteligentes e fiscalização de trânsito',
    services: [
      { id: 'Rastreamento e Gestão de Frota', name: 'Mobilidade (Rastreamento por GPS & Diárias de Veículos Oficiais)', description: 'Controle de saídas de viaturas, telemetria, autorizações de abastecimento e manutenção veicular preventiva', defaultSlaHours: 4 },
      { id: 'Semáforos e CFTV Viário', name: 'Mobilidade (Central Semafórica, Câmeras de Trânsito & CFTV)', description: 'Ajuste de sincronismo de semáforos, monitoramento por câmeras e manutenção de sensores no asfalto', defaultSlaHours: 2 },
      { id: 'Fiscalização e Recursos de Infrações', name: 'Mobilidade (Sistemas de Infrações de Trânsito & Recursos JARI)', description: 'Processamento de autuações eletrônicas, tramitação de defesas de multas e certidões de trânsito', defaultSlaHours: 12 }
    ]
  }
};

/**
 * Retorna as classificações disponíveis para um setor específico.
 * Se o setor não tiver um catálogo pré-configurado, retorna opções genéricas.
 */
export function getServicesForSector(sector: string): GLPIServiceCategory[] {
  const norm = normalizeSectorKey(sector);
  const found = GLPI_SECTORS_CATALOG[norm];
  if (found) return found.services;

  // Fallback genérico para novos setores personalizados
  return [
    { id: `${sector} - Atendimento Geral`, name: `${sector} (Atendimento Operacional & Geral)`, description: 'Demandas rotineiras do setor', defaultSlaHours: 8 },
    { id: `${sector} - Especializado`, name: `${sector} (Demanda Técnica Especializada)`, description: 'Atividades complexas e auditoria setorial', defaultSlaHours: 12 },
    { id: `${sector} - Gestão e Processos`, name: `${sector} (Gestão de Processos & Pareceres)`, description: 'Elaboração de relatórios e documentação oficial', defaultSlaHours: 24 }
  ];
}

/**
 * Normaliza o nome do setor para chave de catálogo
 */
export function normalizeSectorKey(sector: string): string {
  const s = (sector || '').toLowerCase().trim();
  if (s.includes('patrim')) return 'Patrimônio';
  if (s.includes('dba') || s.includes('dado') || s.includes('banco')) return 'DBA';
  if (s.includes('cyber') || s.includes('seguran') || s.includes('soc')) return 'Cyber Security';
  if (s.includes('admin') || s.includes('rh') || s.includes('compras') || s.includes('licit') || s.includes('almoxarif') || s.includes('gest') || s.includes('protocolo')) return 'Administrativo';
  if (s.includes('fazend') || s.includes('tribut') || s.includes('finan') || s.includes('iptu') || s.includes('iss')) return 'Fazenda';
  if (s.includes('saud') || s.includes('sus') || s.includes('sms') || s.includes('prontu')) return 'Saúde';
  if (s.includes('educ') || s.includes('semed') || s.includes('escol')) return 'Educação';
  if (s.includes('mobili') || s.includes('transit') || s.includes('frota') || s.includes('detrans')) return 'Mobilidade Urbana';
  if (s.includes('n3') || s.includes('infra')) return 'N3';
  if (s.includes('n2') || s.includes('rede')) return 'N2';
  if (s.includes('n1') || s.includes('suporte')) return 'N1';
  if (s.includes('front')) return 'Front-End';
  if (s.includes('back')) return 'Back-End';
  return sector;
}

/**
 * Lista todas as classificações de serviços catalogadas em todos os setores
 */
export function getAllCatalogedServices(): { sector: string; serviceId: string; serviceName: string; area: string }[] {
  const result: { sector: string; serviceId: string; serviceName: string; area: string }[] = [];
  Object.values(GLPI_SECTORS_CATALOG).forEach(sec => {
    sec.services.forEach(srv => {
      result.push({
        sector: sec.sector,
        serviceId: srv.id,
        serviceName: srv.name,
        area: sec.area
      });
    });
  });
  return result;
}
