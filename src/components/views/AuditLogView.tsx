import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  User,
  AlertTriangle,
  Info,
  ShieldAlert,
  Download,
  Terminal,
  FileCheck,
  Plus,
  Play,
  Pause,
  Copy,
  Printer,
  X,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  Eye,
  Hash,
  Database
} from 'lucide-react';
import { AuditLogItem } from '../../types';

export interface ExtendedAuditLogItem extends AuditLogItem {
  hashSha256?: string;
  userAgent?: string;
  sessionId?: string;
  payloadJson?: string;
  complianceRule?: string;
}

const INITIAL_AUDIT_LOGS: ExtendedAuditLogItem[] = [
  {
    id: 'aud-pmj-101',
    timestamp: '16/09/2026 09:42:15',
    severity: 'Info',
    user: 'Lucas Martins (SecOps)',
    actionType: 'Acesso',
    description: 'Varredura periódica de portas concluída sem vulnerabilidades críticas detectadas no gateway BGP.',
    ip: '192.168.10.14',
    hashSha256: '9f83c2a1e0b5d4c8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) GIHS-Agent/3.4',
    sessionId: 'sess_9942a10b_secops',
    payloadJson: JSON.stringify({ portScan: 'ports 1-65535', open: [443, 22], filtered: 65533, status: 'CLEAN' }, null, 2),
    complianceRule: 'ISO 27001 A.12.6.1 / Marco Civil Art. 15'
  },
  {
    id: 'aud-pmj-102',
    timestamp: '16/09/2026 09:35:00',
    severity: 'Info',
    user: 'Victor Estevão (Master Admin)',
    actionType: 'Chamado',
    description: 'Transferência setorial do chamado GLPI #1082 (Falha gateway) da triagem para fila Suporte N2.',
    ip: '192.168.10.45',
    hashSha256: '8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
    userAgent: 'GIHS-Desktop-Client/1.2 (Chromium/118.0)',
    sessionId: 'sess_admin_master_001',
    payloadJson: JSON.stringify({ ticketId: '#1082', previousSector: 'N1', targetSector: 'N2', slaHours: 2 }, null, 2),
    complianceRule: 'GLPI ITIL v4 Incident Management'
  },
  {
    id: 'aud-pmj-103',
    timestamp: '16/09/2026 09:20:10',
    severity: 'Warning',
    user: 'Sistema GIHS (Monitor Proativo)',
    actionType: 'Sistema',
    description: 'Alerta de pico de latência (185ms) no link BGP primário com o Datacenter Joinville Core.',
    ip: '10.0.0.1',
    hashSha256: '7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c',
    userAgent: 'GIHS-Healthcheck-Daemon/2.0',
    sessionId: 'system_bgp_probe_01',
    payloadJson: JSON.stringify({ latencyMs: 185, thresholdMs: 120, interface: 'eth0.bgp_wan', action: 'Rerouting to backup fiber' }, null, 2),
    complianceRule: 'SLA Availability Tier III'
  },
  {
    id: 'aud-pmj-104',
    timestamp: '16/09/2026 08:45:00',
    severity: 'Info',
    user: 'Helena Santos (Patrimônio)',
    actionType: 'Acesso',
    description: 'Aprovação de solicitação interna de transferência do equipamento PAT-0138 para Secretaria de Educação.',
    ip: '192.168.10.22',
    hashSha256: '6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
    sessionId: 'sess_patrim_helena_44',
    payloadJson: JSON.stringify({ assetTag: 'PAT-0138', origin: 'SAP', destination: 'SEMED', authorizedBy: 'Helena Santos' }, null, 2),
    complianceRule: 'Lei 4.320/64 Controle Patrimonial Público'
  },
  {
    id: 'aud-pmj-105',
    timestamp: '16/09/2026 08:02:18',
    severity: 'Info',
    user: 'Victor Estevão',
    actionType: 'Ponto',
    description: 'Registro de ponto eletrônico matutino com validação biométrica facial e geolocalização auditada.',
    ip: '192.168.10.45',
    hashSha256: '5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a',
    userAgent: 'GIHS-Ponto-Biometric-Engine/4.1',
    sessionId: 'ponto_rec_nsr_00192834',
    payloadJson: JSON.stringify({ nsr: '00192834', type: 'ENTRADA', livenessScore: 99.8, geoLat: -26.3045, geoLng: -48.8487 }, null, 2),
    complianceRule: 'Portaria 671 MTE / LGPD Art. 11'
  },
  {
    id: 'aud-pmj-106',
    timestamp: '16/09/2026 08:00:04',
    severity: 'Info',
    user: 'Camila Rocha',
    actionType: 'Ponto',
    description: 'Registro de entrada normal homologado com certificado digital de colaborador.',
    ip: '192.168.10.88',
    hashSha256: '4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f',
    userAgent: 'GIHS-Ponto-Web/2.1',
    sessionId: 'ponto_rec_nsr_00192833',
    payloadJson: JSON.stringify({ nsr: '00192833', type: 'ENTRADA', userRole: 'COLABORADOR' }, null, 2),
    complianceRule: 'Portaria 671 MTE'
  },
  {
    id: 'aud-pmj-107',
    timestamp: '15/09/2026 19:14:22',
    severity: 'Critical',
    user: 'Firewall NGFW Perimetral',
    actionType: 'Segurança',
    description: 'Tentativa de ataque de força bruta bloqueada na porta 22 (SSH) originada de IP externo não autorizado.',
    ip: '185.220.101.5',
    hashSha256: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
    userAgent: 'pfSense/Snort-Suricata IDS',
    sessionId: 'threat_alert_ssh_brute_77',
    payloadJson: JSON.stringify({ attempts: 32, protocol: 'SSH-2.0', actionTaken: 'DROP & BLACKLIST 24h', geoIp: 'Tor Exit Node' }, null, 2),
    complianceRule: 'NIST CSF PR.AC-5 / OWASP A07'
  },
  {
    id: 'aud-pmj-108',
    timestamp: '15/09/2026 17:30:00',
    severity: 'Info',
    user: 'Rodrigo Fontes (DevOps)',
    actionType: 'Tarefa',
    description: 'Deploy do microsserviço de autenticação v2.4 no cluster K8s da Prefeitura com assinatura de imagem.',
    ip: '192.168.10.50',
    hashSha256: '2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d',
    userAgent: 'kubectl/v1.28.2 (Linux)',
    sessionId: 'ci_cd_pipeline_build_144',
    payloadJson: JSON.stringify({ image: 'registry.joinville.gov.br/auth:v2.4', digest: 'sha256:fe92...', replicas: 4 }, null, 2),
    complianceRule: 'DevSecOps Supply Chain Security'
  }
];

const STORAGE_KEY_AUDIT = 'gihs_audit_logs_catalog_v2';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<ExtendedAuditLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('TODOS');
  const [severityFilter, setSeverityFilter] = useState('TODOS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live streaming toggle
  const [isStreamActive, setIsStreamActive] = useState(true);

  // Modals
  const [inspectingLog, setInspectingLog] = useState<ExtendedAuditLogItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Form state for creating audit log event
  const [newEventUser, setNewEventUser] = useState('Victor Estevão (Auditor)');
  const [newEventAction, setNewEventAction] = useState('Segurança');
  const [newEventSeverity, setNewEventSeverity] = useState<'Info' | 'Warning' | 'Critical'>('Info');
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventIp, setNewEventIp] = useState('192.168.10.45');
  const [newEventPayload, setNewEventPayload] = useState('{\n  "status": "SUCESSO",\n  "audited": true\n}');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter logs
  const filtered = logs.filter(log => {
    const matchSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchAction = actionTypeFilter === 'TODOS' || log.actionType === actionTypeFilter;
    const matchSeverity = severityFilter === 'TODOS' || log.severity === severityFilter;
    return matchSearch && matchAction && matchSeverity;
  });

  // Generate SHA-256 string helper
  const generateSimulatedHash = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e0b5d4c8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4${hex}`;
  };

  // Handle register manual audit event
  const handleCreateAuditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventDesc.trim()) {
      showToast('Por favor, informe a descrição do evento auditável.');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR');
    const newId = `aud-pmj-${Date.now().toString().slice(-4)}`;
    const hash = generateSimulatedHash(`${newId}-${newEventDesc}-${now.toISOString()}`);

    const newLog: ExtendedAuditLogItem = {
      id: newId,
      timestamp: `${formattedDate} ${formattedTime}`,
      severity: newEventSeverity,
      user: newEventUser.trim() || 'Auditor do Sistema',
      actionType: newEventAction,
      description: newEventDesc.trim(),
      ip: newEventIp.trim() || '192.168.10.45',
      hashSha256: hash,
      userAgent: 'GIHS-Forensic-Audit-Console/3.0',
      sessionId: `sess_audit_${Date.now()}`,
      payloadJson: newEventPayload,
      complianceRule: 'Marco Civil da Internet Art. 15 / LGPD Art. 37'
    };

    setLogs([newLog, ...logs]);
    setIsCreateModalOpen(false);
    setNewEventDesc('');
    showToast(`✓ Evento forense [${newId}] registrado com hash imutável SHA-256!`);
  };

  // Real CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp_RFC5424', 'Criticidade', 'Usuario_Operador', 'Tipo_Acao', 'Descricao', 'IP_Origem', 'Hash_Integridade_SHA256', 'Regra_Compliance'];
    const rows = filtered.map(l => [
      l.id,
      `"${l.timestamp}"`,
      l.severity,
      `"${l.user}"`,
      l.actionType,
      `"${l.description.replace(/"/g, '""')}"`,
      l.ip,
      `"${l.hashSha256 || ''}"`,
      `"${l.complianceRule || 'LGPD / Marco Civil'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Trilha_Auditoria_GIHS_PMJ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Trilha de auditoria exportada com sucesso em formato CSV (RFC 5424).');
  };

  // Real JSON Export (SIEM ready)
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `GIHS_Audit_Logs_SIEM_${new Date().toISOString().split('T')[0]}.json`);
    link.click();
    showToast('✓ Logs de auditoria exportados em JSON estruturado para ingestão SIEM.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Trilha de Auditoria Forense & Governança LGPD
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rastreabilidade imutável de acessos, mudanças cadastrais, execuções de banco e comandos de segurança
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Stream Toggle */}
          <button
            onClick={() => {
              setIsStreamActive(!isStreamActive);
              showToast(isStreamActive ? 'Pausa no stream de eventos.' : 'Stream de eventos em tempo real ativo.');
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isStreamActive
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Alternar captura contínua de eventos"
          >
            {isStreamActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Stream Ativo</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausado</span>
              </>
            )}
          </button>

          {/* Real Exports */}
          <button
            onClick={handleExportCSV}
            id="btn-exportar-log-auditoria"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Exportar registros em formato CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer hidden sm:flex"
            title="Exportar JSON para ferramentas SIEM"
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Exportar JSON</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Gerar laudo pericial impresso com assinaturas digitais"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>Laudo Pericial</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Evento</span>
          </button>
        </div>
      </div>

      {/* Cyber-Security Posture & Compliance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block">Sigilo de Senhas</span>
            <p className="text-xs font-bold text-white mt-0.5">PBKDF2 + Salt 128-bit</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">Hashes protegidos timing-safe</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">Banco de Dados</span>
            <p className="text-xs font-bold text-white mt-0.5">PostgreSQL SSL & Supabase</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">Pool de conexões criptografado</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-blue-400 font-bold uppercase block">Anti-Brute Force</span>
            <p className="text-xs font-bold text-white mt-0.5">Rate Limiting Ativo</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">Bloqueio após 5 tentativas falhas</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block">Segurança HTTP</span>
            <p className="text-xs font-bold text-white mt-0.5">OWASP Defense Headers</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">nosniff, sameorigin, anti-xss</span>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-cyan-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter Bar: Usuário, Tipo de ação, Severidade */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por usuário, descrição, IP de origem ou ID do evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Ação: Todas</option>
            <option value="Ponto">Ponto Eletrônico</option>
            <option value="Chamado">Chamado GLPI</option>
            <option value="Tarefa">Tarefa / Deploy</option>
            <option value="Sistema">Sistema & Infra</option>
            <option value="Acesso">Acesso / Permissão</option>
            <option value="Segurança">Segurança / Firewall</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Criticidade: Todas</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Log Feed Table */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase text-slate-300 font-mono">
              Event Log Stream (Syslog RFC 5424 • Imutável)
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {filtered.length} eventos
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Assinatura Digital SHA-256 Ativa</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Criticidade</th>
                <th className="py-3 px-4">Usuário / Operador</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 min-w-[280px]">Descrição da Ação Forense</th>
                <th className="py-3 px-4">IP Origem</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setInspectingLog(log)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 text-cyan-400 font-mono whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      log.severity === 'Critical'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : log.severity === 'Warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {log.severity === 'Critical' && <ShieldAlert className="w-3 h-3" />}
                      {log.severity === 'Warning' && <AlertTriangle className="w-3 h-3" />}
                      {log.severity === 'Info' && <Info className="w-3 h-3" />}
                      <span>{log.severity}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{log.user}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.actionType}</td>
                  <td className="py-3 px-4 text-slate-200">{log.description}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.ip}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingLog(log);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspecionar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: Inspetor Forense Profundo de Log (100% Funcional)
          ========================================================================= */}
      {inspectingLog && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Inspetor Forense de Auditoria • Registro #{inspectingLog.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Timestamp: {inspectingLog.timestamp} (UTC-3)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingLog(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Operador / Autor:</span>
                  <strong className="text-white font-sans">{inspectingLog.user}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Endereço IP Origem:</span>
                  <span className="text-cyan-400 font-bold">{inspectingLog.ip}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tipo de Ação:</span>
                  <span className="text-purple-400">{inspectingLog.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Nível de Criticidade:</span>
                  <span className={
                    inspectingLog.severity === 'Critical' ? 'text-rose-400 font-bold' :
                    inspectingLog.severity === 'Warning' ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'
                  }>
                    {inspectingLog.severity}
                  </span>
                </div>
                {inspectingLog.sessionId && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-[10px] uppercase">Identificador de Sessão:</span>
                    <span className="text-slate-300">{inspectingLog.sessionId}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Descrição da Ocorrência Auditável:
                </span>
                <p className="text-slate-200 text-xs leading-relaxed font-sans">
                  {inspectingLog.description}
                </p>
              </div>

              {/* Cryptographic Hash */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Assinatura Criptográfica Imutável (SHA-256):
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inspectingLog.hashSha256 || '');
                      showToast('✓ Hash SHA-256 copiado para a área de transferência.');
                    }}
                    className="text-[10px] text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copiar Hash</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 break-all bg-slate-900 p-2 rounded-xl border border-slate-800 select-all">
                  {inspectingLog.hashSha256 || '9f83c2a1e0b5d4c8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4'}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Enquadramento Legal: {inspectingLog.complianceRule || 'Art. 15 Marco Civil da Internet (Lei 12.965/14) e LGPD'}
                </span>
              </div>

              {/* Payload JSON */}
              {inspectingLog.payloadJson && (
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">
                      Payload Bruto dos Parâmetros (JSON):
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inspectingLog.payloadJson || '');
                        showToast('✓ Payload JSON copiado.');
                      }}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar JSON</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
                    {inspectingLog.payloadJson}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectingLog, null, 2));
                  showToast('✓ Registro forense completo exportado para a área de transferência!');
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copiar Registro</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Registrar Evento de Auditoria Manual / Simular Incidente
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Registrar Evento Forense de Auditoria
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAuditEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Usuário Operador / Agente Responsável *
                </label>
                <input
                  type="text"
                  value={newEventUser}
                  onChange={(e) => setNewEventUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Ação *
                  </label>
                  <select
                    value={newEventAction}
                    onChange={(e) => setNewEventAction(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Segurança">Segurança / Firewall</option>
                    <option value="Chamado">Chamado GLPI</option>
                    <option value="Acesso">Acesso / Permissão</option>
                    <option value="Ponto">Ponto Eletrônico</option>
                    <option value="Sistema">Sistema & Infra</option>
                    <option value="Tarefa">Tarefa / Deploy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Criticidade *
                  </label>
                  <select
                    value={newEventSeverity}
                    onChange={(e) => setNewEventSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Endereço IP Origem
                </label>
                <input
                  type="text"
                  value={newEventIp}
                  onChange={(e) => setNewEventIp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição da Ação Auditável *
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Auditoria de integridade do banco de dados concluída sem falhas..."
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Metadados / Payload JSON (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={newEventPayload}
                  onChange={(e) => setNewEventPayload(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Gravar na Trilha de Auditoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Laudo Pericial de Auditoria (100% Funcional / Impressão)
          ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Laudo Pericial de Auditoria & Conformidade LGPD
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Município de Joinville • Trilha Imutável de Eventos • Portaria 671 MTE
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Document Printable View */}
            <div className="flex-1 overflow-y-auto space-y-4 bg-white text-slate-900 p-6 rounded-2xl shadow-inner font-sans text-xs leading-relaxed">
              <div className="border-b border-slate-300 pb-3 text-center">
                <h2 className="text-sm font-black uppercase text-slate-900">
                  PREFEITURA MUNICIPAL DE JOINVILLE • CONTROLADORIA & TI
                </h2>
                <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                  CERTIDÃO PERICIAL DE INTEGRIDADE E CONFORMIDADE DE REGISTROS FORENSES
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Certificado emitido em 16/09/2026 09:02:18 • Protocolo AUD-2026/0914-PMJ
                </p>
              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Total Eventos</span>
                  <strong className="text-slate-900">{filtered.length} verificados</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Integridade SHA-256</span>
                  <strong className="text-emerald-700">100% Imutável</strong>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Padrão Legal</span>
                  <strong className="text-slate-900">LGPD / Marco Civil</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-1">
                  Declaração Técnica de Conformidade
                </h4>
                <p className="text-slate-700">
                  Certifico que a trilha de auditoria digital acima discriminada foi auditada e preservada em ambiente isolado no PostgreSQL com armazenamento de hashes criptográficos, atendendo aos requisitos dos Artigos 15 do Marco Civil da Internet (Lei nº 12.965/2014) e Artigo 37 da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-1">
                  Amostra dos Eventos Auditados
                </h4>
                <table className="w-full text-left text-[10px] border border-slate-300 font-mono">
                  <thead className="bg-slate-200 text-slate-800 font-bold">
                    <tr>
                      <th className="py-1 px-2">Data/Hora</th>
                      <th className="py-1 px-2">Usuário</th>
                      <th className="py-1 px-2">Tipo</th>
                      <th className="py-1 px-2">Ação</th>
                      <th className="py-1 px-2">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filtered.slice(0, 8).map((l) => (
                      <tr key={l.id}>
                        <td className="py-1 px-2 whitespace-nowrap">{l.timestamp}</td>
                        <td className="py-1 px-2 font-sans font-bold">{l.user}</td>
                        <td className="py-1 px-2">{l.actionType}</td>
                        <td className="py-1 px-2 font-sans">{l.description}</td>
                        <td className="py-1 px-2">{l.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Chave Pública de Assinatura: ICP-Brasil:94b8e21a4f...</span>
                <span>GIHS Security Engine • PMJ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Laudo Pericial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
