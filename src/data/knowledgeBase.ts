import { KnowledgeArticle } from '../types';

export const KNOWLEDGE_BASE_DATA: KnowledgeArticle[] = [
  // --- N1 (Suporte N1) ---
  {
    id: 'KB-N1-001',
    code: 'N1-AUTH-01',
    title: 'Reset de Credenciais de Rede & Ativação de MFA / 2FA',
    sector: 'N1',
    serviceType: 'Reset de Credenciais & 2FA',
    category: 'Acessos & Identidade',
    summarySolution: 'Validação de identidade via gestor, reset de senha temporária no Active Directory e pareamento de autenticador TOTP com código de backup.',
    detailedProcedure: [
      'Confirmar identidade do solicitante por canal oficial com validação da chefia imediata.',
      'Acessar o console do Active Directory / Identity Provider.',
      'Definir senha provisória de alta entropia com flag "Exigir troca no próximo logon".',
      'Revogar sessões ativas e registrar novo código de emparelhamento MFA no Authenticator.',
      'Testar login em ambiente de homologação e notificar o usuário com instruções seguras.'
    ],
    estimatedResolutionMinutes: 15,
    tags: ['senha', 'mfa', 'totp', 'active directory', 'login', 'acesso'],
    usefulCount: 48,
    lastUpdated: '16/09/2026',
    author: 'Mariana Castro'
  },
  {
    id: 'KB-N1-002',
    code: 'N1-HW-02',
    title: 'Falha de Spooler e Impressora Fiscal PDV sem Comunicação',
    sector: 'N1',
    serviceType: 'Configuração de Periféricos & PDV',
    category: 'Hardware & Periféricos',
    summarySolution: 'Parada do serviço Spooler, expurgo da fila em disco C:\\Windows\\System32\\spool\\PRINTERS, reinício do serviço e teste de impressão de cupom fiscal.',
    detailedProcedure: [
      'Executar prompt de comando como Administrador: "net stop spooler".',
      'Navegar até a pasta "C:\\Windows\\System32\\spool\\PRINTERS" e deletar arquivos .shd e .spl retidos.',
      'Reiniciar o serviço com "net start spooler".',
      'Desconectar e reconectar o cabo USB/Serial da impressora térmica.',
      'Imprimir página de teste pelo driver do fabricante e validar no software do PDV.'
    ],
    estimatedResolutionMinutes: 20,
    tags: ['impressora', 'pdv', 'spooler', 'fiscal', 'varejo', 'hardware'],
    usefulCount: 32,
    lastUpdated: '14/09/2026',
    author: 'Gabriel Ribeiro'
  },
  {
    id: 'KB-N1-003',
    code: 'N1-MAIL-03',
    title: 'Criação e Provisionamento de Contas Corporativas de E-mail',
    sector: 'N1',
    serviceType: 'Provisionamento de Contas & E-mail',
    category: 'Acessos & Identidade',
    summarySolution: 'Criação da caixa postal com domínio corporativo, atribuição de licença, inclusão nos grupos de distribuição do setor e envio de guia de boas-vindas.',
    detailedProcedure: [
      'Consultar ticket de solicitação aprovado pelo RH/Gestão com nome completo e cargo.',
      'Acessar painel corporativo do Workspace / Exchange Admin Center.',
      'Criar usuário no formato "nome.sobrenome@empresa.com.br".',
      'Atribuir licença padrão do colaborador e vincular aos grupos do setor correspondente.',
      'Configurar encaminhamentos e políticas de retenção padrão LGPD.',
      'Enviar credenciais e guia de primeiro acesso via canal criptografado.'
    ],
    estimatedResolutionMinutes: 25,
    tags: ['email', 'workspace', 'exchange', 'onboarding', 'novo colaborador'],
    usefulCount: 29,
    lastUpdated: '12/09/2026',
    author: 'Larissa Lima'
  },

  // --- N2 (Suporte N2) ---
  {
    id: 'KB-N2-001',
    code: 'N2-NET-01',
    title: 'Falha de Rota no Gateway e Desconexão de Túnel VPN IPsec',
    sector: 'N2',
    serviceType: 'Diagnóstico de Rota & Conectividade VPN',
    category: 'Redes & Conectividade',
    summarySolution: 'Reinicialização do túnel IPsec Fase 1 e 2 no concentrador de borda, verificação de rotas estáticas na tabela do roteador filial e teste de MTU.',
    detailedProcedure: [
      'Efetuar teste de ping e traceroute até o gateway da filial afetada.',
      'Acessar a interface de gerência do firewall corporativo (Fortinet / pfSense).',
      'Verificar o status dos túneis IPsec: logs de renegotiation e correspondência de Phase 1/2.',
      'Executar comando de reset do túnel: "vpn ipsec tunnel reset [nome-do-tunel]".',
      'Conferir MTU para evitar fragmentação de pacotes (ajustar MSS clamping se necessário).',
      'Confirmar tráfego bidirecional através de captura de pacotes tcpdump.'
    ],
    estimatedResolutionMinutes: 40,
    tags: ['vpn', 'ipsec', 'rota', 'gateway', 'rede', 'filial', 'firewall'],
    usefulCount: 54,
    lastUpdated: '16/09/2026',
    author: 'Victor Estevão'
  },
  {
    id: 'KB-N2-002',
    code: 'N2-SYS-02',
    title: 'Latência Crítica e Esgotamento de Recursos em Estações Locais',
    sector: 'N2',
    serviceType: 'Otimização de Sistema & Performance',
    category: 'Sistemas & ERP',
    summarySolution: 'Análise de processos zumbis, limpeza de cache DNS/WINS, liberação de espaço em disco e ajuste no arquivo hosts/serviços de rede.',
    detailedProcedure: [
      'Acessar a máquina remotamente via AnyDesk ou SSH corporativo.',
      'Identificar processos consumindo 100% de CPU ou IO de disco com Resource Monitor / top.',
      'Executar limpeza de DNS: "ipconfig /flushdns" e renovação DHCP.',
      'Expurgar caches temporários em %temp% e logs acumulados.',
      'Verificar se o software antivírus corporativo travou em scanning recursivo e reiniciar agente.'
    ],
    estimatedResolutionMinutes: 35,
    tags: ['latencia', 'desempenho', 'lentidao', 'windows', 'memoria', 'disco'],
    usefulCount: 22,
    lastUpdated: '15/09/2026',
    author: 'Juliana Pires'
  },
  {
    id: 'KB-N2-003',
    code: 'N2-SEC-03',
    title: 'Desbloqueio de IP Bloqueado por Tentativas Consecutivas de Acesso',
    sector: 'N2',
    serviceType: 'Desbloqueio de IP & Políticas de Segurança',
    category: 'Segurança & LGPD',
    summarySolution: 'Verificação da lista de Fail2Ban e tabelas de drop do firewall, validação com o usuário para evitar ataque de dicionário e liberação da regra.',
    detailedProcedure: [
      'Consultar log de auditoria do firewall buscando o IP público do cliente/filial.',
      'Identificar motivo do bloqueio (ex: 5 falhas no serviço RDP ou SMTP em 2 minutos).',
      'Confirmar que a máquina que gerou as requisições é legítima e passou por checagem antivírus.',
      'Remover IP da tabela de ban temporário com "pfctl -t abusive_hosts -T delete [IP]".',
      'Reorientar o usuário sobre o número máximo de tentativas de senha.'
    ],
    estimatedResolutionMinutes: 20,
    tags: ['bloqueio', 'firewall', 'fail2ban', 'ip', 'segurança', 'acesso'],
    usefulCount: 38,
    lastUpdated: '13/09/2026',
    author: 'Victor Estevão'
  },

  // --- N3 (Suporte N3 & Infraestrutura) ---
  {
    id: 'KB-N3-001',
    code: 'N3-BGP-01',
    title: 'Comutação Emergencial de Link Dedicado e Failover BGP',
    sector: 'N3',
    serviceType: 'Comutação de Link & Roteamento BGP',
    category: 'Redes & Conectividade',
    summarySolution: 'Abertura de ticket emergencial na operadora de telecom, ajuste de AS-Path prepending e comutação forçada para a rota de backup sem perda de pacotes.',
    detailedProcedure: [
      'Monitorar status das sessões BGP no roteador de borda (show ip bgp summary).',
      'Constatar perda de pacotes ou instabilidade no ASN do provedor primário.',
      'Elevar a Local Preference da rota alternativa ou aplicar prepend na rota primária degradada.',
      'Validar propagação do tráfego nos concentradores de borda externos.',
      'Registrar chamado com o NOC da operadora e acompanhar SLA de restauração.'
    ],
    estimatedResolutionMinutes: 60,
    tags: ['bgp', 'datacenter', 'link dedicado', 'operadora', 'failover', 'infraestrutura'],
    usefulCount: 41,
    lastUpdated: '15/09/2026',
    author: 'Carlos Eduardo'
  },
  {
    id: 'KB-N3-002',
    code: 'N3-VIRT-02',
    title: 'Esgotamento de Memória / CPU em Host de Virtualização Proxmox/VMware',
    sector: 'N3',
    serviceType: 'Balanceamento de Recursos de Virtualização',
    category: 'Infraestrutura & Nuvem',
    summarySolution: 'Execução de Live Migration de instâncias não críticas para nó secundário do cluster, compactação de volumes e redimensionamento de pools de RAM.',
    detailedProcedure: [
      'Identificar nós do cluster com utilização acima de 85% de CPU/RAM.',
      'Acionar live migration (vMotion) das VMs de baixa prioridade para hosts ociosos.',
      'Verificar integridade do armazenamento SAN/NFS compartilhado.',
      'Ajustar reserva dinâmica de memória (memory ballooning).',
      'Confirmar estabilização dos alarmes no dashboard Zabbix / Grafana.'
    ],
    estimatedResolutionMinutes: 45,
    tags: ['virtualizacao', 'vmware', 'proxmox', 'cluster', 'servidor', 'datacenter'],
    usefulCount: 19,
    lastUpdated: '10/09/2026',
    author: 'Carlos Eduardo'
  },

  // --- DBA (Bancos de Dados) ---
  {
    id: 'KB-DBA-001',
    code: 'DBA-PERF-01',
    title: 'Otimização de Query com Sequential Scan e Criação de Índices B-Tree',
    sector: 'DBA',
    serviceType: 'Otimização de Query & Banco de Dados',
    category: 'Bancos de Dados',
    summarySolution: 'Execução de EXPLAIN ANALYZE no schema de produção, constatação de full-scan em tabela de faturamento/rastreamento e criação de índice composto parcial.',
    detailedProcedure: [
      'Coletar a query em lentidão no log de slow queries (pg_stat_statements).',
      'Rodar "EXPLAIN (ANALYZE, BUFFERS) [QUERY]" para mapear o custo de execução.',
      'Identificar filtros que não utilizam índices (ex: campos de data ou status).',
      'Criar índice com comando CONCURRENTLY para não travar gravações em produção.',
      'Executar "ANALYZE [TABELA]" para recalcular as estatísticas do planejador PostgreSQL.',
      'Verificar redução do tempo de resposta de segundos para milissegundos.'
    ],
    estimatedResolutionMinutes: 50,
    tags: ['dba', 'postgres', 'query', 'indice', 'performance', 'slow query', 'sql'],
    usefulCount: 63,
    lastUpdated: '16/09/2026',
    author: 'Camila Rocha'
  },
  {
    id: 'KB-DBA-002',
    code: 'DBA-LOCK-02',
    title: 'Destravamento de Conexões Travadas em "idle in transaction" e Deadlocks',
    sector: 'DBA',
    serviceType: 'Destravamento de Locks & Conexões DBA',
    category: 'Bancos de Dados',
    summarySolution: 'Identificação de PIDs em espera na view pg_stat_activity, análise do grafo de lock e cancelamento da consulta bloqueadora com pg_cancel_backend.',
    detailedProcedure: [
      'Executar consulta para listar queries com espera superior a 30 segundos.',
      'Mapear qual transação está mantendo o RowExclusiveLock ou AccessExclusiveLock.',
      'Tentar cancelamento suave com "SELECT pg_cancel_backend(pid)".',
      'Se não responder em 10 segundos, finalizar a conexão com "SELECT pg_terminate_backend(pid)".',
      'Notificar os desenvolvedores para revisão de transações sem COMMIT/ROLLBACK no código.'
    ],
    estimatedResolutionMinutes: 30,
    tags: ['deadlock', 'lock', 'postgres', 'transacao', 'pool', 'dba'],
    usefulCount: 35,
    lastUpdated: '11/09/2026',
    author: 'Lucas Almeida'
  },

  // --- Cyber Security ---
  {
    id: 'KB-SEC-001',
    code: 'SEC-AUD-01',
    title: 'Auditoria de Chaves SSH e Rotação de Certificados TLS/SSL',
    sector: 'Cyber Security',
    serviceType: 'Auditoria de Segurança & Certificados',
    category: 'Segurança & LGPD',
    summarySolution: 'Auditoria automatizada nos arquivos authorized_keys do cluster, revogação de acessos desligados e emissão de novo certificado wildcard com Let\'s Encrypt.',
    detailedProcedure: [
      'Executar script de auditoria de conformidade em todos os servidores produtivos.',
      'Cruzar a lista de chaves públicas autorizadas com o organograma de colaboradores ativos.',
      'Remover credenciais de ex-colaboradores e chaves fracas (RSA < 3072 ou ECDSA legado).',
      'Verificar expiração de certificados de borda no Traefik/Nginx e renovar via Certbot.',
      'Gerar relatório de conformidade criptografado e anexar à auditoria do sistema.'
    ],
    estimatedResolutionMinutes: 55,
    tags: ['seguranca', 'ssh', 'ssl', 'tls', 'certificado', 'lgpd', 'criptografia'],
    usefulCount: 44,
    lastUpdated: '16/09/2026',
    author: 'Lucas Martins'
  },
  {
    id: 'KB-SEC-002',
    code: 'SEC-MAL-02',
    title: 'Resposta a Incidente de Tentativa de Phishing e Engenharia Social',
    sector: 'Cyber Security',
    serviceType: 'Resposta a Incidentes & Phishing',
    category: 'Segurança & LGPD',
    summarySolution: 'Análise de cabeçalhos de e-mail (SPF/DKIM/DMARC), bloqueio de domínios maliciosos nas regras de transporte e expurgo de caixas postais corporativas.',
    detailedProcedure: [
      'Coletar arquivo .eml do e-mail suspeito enviado por usuário.',
      'Analisar IPs de origem e autenticação SPF/DKIM/DMARC.',
      'Extrair URLs e hashes de anexos para consulta em sandbox (VirusTotal).',
      'Bloquear remetente e domínio nas políticas de segurança do mail gateway.',
      'Executar busca e expurgo em lote no servidor de e-mail para remover mensagens idênticas.',
      'Publicar comunicado preventivo no canal corporativo de segurança.'
    ],
    estimatedResolutionMinutes: 45,
    tags: ['phishing', 'segurança', 'email', 'dmarc', 'incidente', 'soc'],
    usefulCount: 37,
    lastUpdated: '14/09/2026',
    author: 'Fernanda Costa'
  },

  // --- Back-End & Aplicações ---
  {
    id: 'KB-BE-001',
    code: 'BE-API-01',
    title: 'Depuração de Erro 502 Bad Gateway no Endpoint de Checkout e Pix',
    sector: 'Back-End',
    serviceType: 'Depuração de API & Microsserviços',
    category: 'Aplicações & APIs',
    summarySolution: 'Reinicio dos pods do microsserviço de pagamento, revalidação do pool de conexões HTTP keep-alive e reprocessamento de mensagens na fila dead-letter.',
    detailedProcedure: [
      'Analisar logs centralizados no Elasticsearch / CloudWatch filtrando por status 502.',
      'Verificar se o gateway intermediário (ex: Banco Central / PSP) está com instabilidade.',
      'Reiniciar instâncias do container com tráfego travado.',
      'Validar fila de dead-letter no RabbitMQ e acionar worker de reprocessamento seguro.',
      'Efetuar transação simulada em sandbox e checar retorno 200 OK com webhook confirmado.'
    ],
    estimatedResolutionMinutes: 40,
    tags: ['api', '502', 'pix', 'gateway', 'backend', 'microsservicos', 'rabbitmq'],
    usefulCount: 51,
    lastUpdated: '16/09/2026',
    author: 'Rodrigo Fontes'
  },

  // --- Front-End ---
  {
    id: 'KB-FE-001',
    code: 'FE-UI-01',
    title: 'Correção de Desalinhamento e Quebra de Layout em Dispositivos Móveis',
    sector: 'Front-End',
    serviceType: 'Correção de Layout & Interface Web',
    category: 'Aplicações & APIs',
    summarySolution: 'Ajuste de classes utilitárias de overflow e viewport em tabelas responsivas, testes de viewport em resoluções 360px a 768px e deploy de hotfix.',
    detailedProcedure: [
      'Reproduzir o problema no emulador DevTools simulando iPhone e Android.',
      'Inspecionar containers com largura fixa ou ausência de min-w-0 / overflow-x-auto.',
      'Ajustar quebras de linha com white-space: nowrap nos crachás e botões operacionais.',
      'Validar acessibilidade de toque (área mínima 44px) e contraste de cores WCAG AA.',
      'Realizar commit no repositório e executar pipeline de CI/CD para release da interface.'
    ],
    estimatedResolutionMinutes: 30,
    tags: ['frontend', 'layout', 'responsivo', 'css', 'mobile', 'interface'],
    usefulCount: 26,
    lastUpdated: '15/09/2026',
    author: 'Beatriz Lima'
  },

  // --- Administrativo & Patrimônio ---
  {
    id: 'KB-ADM-001',
    code: 'ADM-PAT-01',
    title: 'Substituição Emergencial de Equipamento e Emissão de Termo de Cautela',
    sector: 'Administrativo',
    serviceType: 'Substituição de Hardware & Termo de Cautela',
    category: 'Hardware & Periféricos',
    summarySolution: 'Separação de notebook reserva homologado do estoque central, clonagem da imagem padrão da empresa e coleta de assinatura no termo patrimonial.',
    detailedProcedure: [
      'Conferir disponibilidade de equipamento sobressalente no inventário patrimonial TI.',
      'Transferir termo de cautela no sistema para o novo número de patrimônio (PAT).',
      'Restaurar backup de arquivos e perfil de usuário a partir do storage corporativo.',
      'Entregar o equipamento ao colaborador com conferência física de carregador e periféricos.',
      'Encaminhar máquina defeituosa para reparo autorizado e atualizar status no inventário.'
    ],
    estimatedResolutionMinutes: 60,
    tags: ['patrimonio', 'notebook', 'estoque', 'termo de cautela', 'administrativo'],
    usefulCount: 31,
    lastUpdated: '15/09/2026',
    author: 'Helena Santos'
  }
];

export const SERVICE_TYPES_BY_SECTOR: Record<string, string[]> = {
  'N1': [
    'Reset de Credenciais & 2FA',
    'Configuração de Periféricos & PDV',
    'Provisionamento de Contas & E-mail',
    'Suporte Help Desk Geral',
    'Instalação de Softwares Homologados'
  ],
  'N2': [
    'Diagnóstico de Rota & Conectividade VPN',
    'Otimização de Sistema & Performance',
    'Desbloqueio de IP & Políticas de Segurança',
    'Configuração de Redes & Switches Locais',
    'Investigação de Falhas de Aplicação'
  ],
  'N3': [
    'Comutação de Link & Roteamento BGP',
    'Balanceamento de Recursos de Virtualização',
    'Manutenção de Servidores e Datacenter',
    'Auditoria de Redundância e Storage SAN',
    'Escalonamento Crítico de Incidentes'
  ],
  'DBA': [
    'Otimização de Query & Banco de Dados',
    'Destravamento de Locks & Conexões DBA',
    'Execução e Validação de Backups',
    'Manutenção de Índices & Particionamento',
    'Migração e Modelagem de Schemas'
  ],
  'Cyber Security': [
    'Auditoria de Segurança & Certificados',
    'Resposta a Incidentes & Phishing',
    'Varredura de Vulnerabilidades & Pentest',
    'Revisão de Políticas de Firewall & LGPD',
    'Investigação de Tráfego Anômalo SOC'
  ],
  'Back-End': [
    'Depuração de API & Microsserviços',
    'Correção de Erros 500 / 502 / 504',
    'Integração de Webhooks & Mensageria',
    'Manutenção de Filas RabbitMQ / Kafka',
    'Ajustes de Regra de Negócio'
  ],
  'Front-End': [
    'Correção de Layout & Interface Web',
    'Otimização de Carregamento e Caches',
    'Ajustes de Acessibilidade & Usabilidade',
    'Atualização de Componentes e Design System',
    'Resolução de Erros de Script SPA'
  ],
  'Administrativo': [
    'Substituição de Hardware & Termo de Cautela',
    'Homologação de Fornecedores de TI',
    'Compras de Licenças e Equipamentos',
    'Gestão de Facilities e Contratos'
  ],
  'RH': [
    'Onboarding / Integração de Colaborador',
    'Gestão de Benefícios & Ponto',
    'Alteração Cadastral e Acessos RH'
  ],
  'Financeiro': [
    'Faturamento e Emissão de Notas Fiscais',
    'Conciliação de Cobranças e Licenças',
    'Liberação de Pagamentos TI'
  ],
  'Gestão': [
    'Aprovação de Orçamento e Mudanças Estratégicas',
    'Auditoria Executiva e Governança'
  ]
};
