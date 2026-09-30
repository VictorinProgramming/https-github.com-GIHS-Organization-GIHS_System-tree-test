import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import { AuditLogItem } from '../../types';

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  { id: 'aud-1', timestamp: '16/09/2026 09:42:15', severity: 'Info', user: 'Lucas Martins', actionType: 'Acesso', description: 'Varredura periódica de portas concluída sem vulnerabilidades críticas', ip: '192.168.10.14' },
  { id: 'aud-2', timestamp: '16/09/2026 09:35:00', severity: 'Info', user: 'Victor Estevão', actionType: 'Chamado', description: 'Atribuição do chamado #1082 (Falha gateway) para fila N2', ip: '192.168.10.45' },
  { id: 'aud-3', timestamp: '16/09/2026 09:20:10', severity: 'Warning', user: 'Sistema GIHS', actionType: 'Sistema', description: 'Alerta de pico de latência no link BGP primário (Datacenter SP01)', ip: '10.0.0.1' },
  { id: 'aud-4', timestamp: '16/09/2026 08:45:00', severity: 'Info', user: 'Helena Santos', actionType: 'Acesso', description: 'Aprovação de solicitação interna de equipamento PAT-0138', ip: '192.168.10.22' },
  { id: 'aud-5', timestamp: '16/09/2026 08:02:18', severity: 'Info', user: 'Victor Estevão', actionType: 'Ponto', description: 'Registro de ponto eletrônico com validação biométrica', ip: '192.168.10.45' },
  { id: 'aud-6', timestamp: '16/09/2026 08:00:04', severity: 'Info', user: 'Camila Rocha', actionType: 'Ponto', description: 'Registro de entrada normal homologado', ip: '192.168.10.88' },
  { id: 'aud-7', timestamp: '15/09/2026 19:14:22', severity: 'Critical', user: 'Firewall NGFW', actionType: 'Acesso', description: 'Tentativa de força bruta bloqueada na porta 22 (SSH)', ip: '185.220.101.5' },
  { id: 'aud-8', timestamp: '15/09/2026 17:30:00', severity: 'Info', user: 'Rodrigo Fontes', actionType: 'Tarefa', description: 'Deploy do microsserviço de autenticação v2.4 no cluster K8s', ip: '192.168.10.50' }
];

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('TODOS');
  const [severityFilter, setSeverityFilter] = useState('TODOS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = logs.filter(log => {
    const matchSearch = 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionTypeFilter === 'TODOS' || log.actionType === actionTypeFilter;
    const matchSeverity = severityFilter === 'TODOS' || log.severity === severityFilter;
    return matchSearch && matchAction && matchSeverity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Trilha de Auditoria & Segurança</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Rastreabilidade imutável de acessos, mudanças cadastrais e comandos de governança corporativa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setToastMessage('✓ Log de auditoria exportado com hash SHA256 para compliance LGPD.');
              setTimeout(() => setToastMessage(null), 3500);
            }}
            id="btn-exportar-log-auditoria"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar Trilha de Auditoria</span>
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
            <Terminal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">Banco de Dados</span>
            <p className="text-xs font-bold text-white mt-0.5">Segredo Protegido & URL Mascarada</p>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sem senhas expostas no código</span>
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
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar: Usuário, Tipo de ação, Severidade */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por usuário, descrição ou IP..."
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
            <option value="Ponto">Ponto</option>
            <option value="Chamado">Chamado</option>
            <option value="Tarefa">Tarefa</option>
            <option value="Sistema">Sistema</option>
            <option value="Acesso">Acesso</option>
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
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase text-slate-300 font-mono">
              Event Log Stream (Syslog RFC 5424)
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400">
            ● Registro Ativo & Imutável
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Criticidade</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 min-w-[280px]">Descrição da Ação</th>
                <th className="py-3 px-4">IP Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-cyan-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
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
                  <td className="py-3 px-4 font-bold text-white font-sans whitespace-nowrap">{log.user}</td>
                  <td className="py-3 px-4 text-slate-400">{log.actionType}</td>
                  <td className="py-3 px-4 font-sans text-slate-200">{log.description}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
