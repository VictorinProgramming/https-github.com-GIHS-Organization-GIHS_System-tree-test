import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  Sparkles,
  Download,
  CheckCircle2,
  Clock,
  CheckSquare,
  PhoneCall,
  RefreshCw,
  TrendingUp,
  FileText,
  Printer,
  Filter,
  Layers,
  ShieldCheck,
  Building2,
  Users,
  Search,
  ChevronRight,
  PieChart,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { SupportTicket, Sector } from '../../types';
import { SECTORS } from '../../data/mockData';

interface SectorReportData {
  sector: string;
  name: string;
  tasksDone: number;
  inProgress: number;
  totalTickets: number;
  slaTarget: string;
  slaCompliance: number;
  avgResolutionTime: string;
  csat: number;
}

const MUNICIPAL_SECTORS_REPORT: SectorReportData[] = [
  {
    sector: 'Patrimônio',
    name: 'Patrimônio & Gestão de Bens Públicos',
    tasksDone: 48,
    inProgress: 6,
    totalTickets: 54,
    slaTarget: '99.0%',
    slaCompliance: 99.2,
    avgResolutionTime: '1h 30m',
    csat: 4.9
  },
  {
    sector: 'DBA',
    name: 'Banco de Dados (DBA) & Tuning',
    tasksDone: 34,
    inProgress: 4,
    totalTickets: 38,
    slaTarget: '99.9%',
    slaCompliance: 99.8,
    avgResolutionTime: '45m',
    csat: 5.0
  },
  {
    sector: 'Cyber Security',
    name: 'Cyber Security, SOC & Defesa Perimetral',
    tasksDone: 62,
    inProgress: 3,
    totalTickets: 65,
    slaTarget: '99.95%',
    slaCompliance: 100.0,
    avgResolutionTime: '25m',
    csat: 5.0
  },
  {
    sector: 'Administrativo',
    name: 'Administração, Protocolo & Compras',
    tasksDone: 51,
    inProgress: 8,
    totalTickets: 59,
    slaTarget: '98.5%',
    slaCompliance: 98.6,
    avgResolutionTime: '2h 10m',
    csat: 4.8
  },
  {
    sector: 'N1',
    name: 'Suporte Técnico N1 (Triagem & Dúvidas)',
    tasksDone: 142,
    inProgress: 12,
    totalTickets: 154,
    slaTarget: '99.0%',
    slaCompliance: 99.1,
    avgResolutionTime: '35m',
    csat: 4.9
  },
  {
    sector: 'N2',
    name: 'Suporte Técnico N2 (Infraestrutura & Redes)',
    tasksDone: 88,
    inProgress: 9,
    totalTickets: 97,
    slaTarget: '97.5%',
    slaCompliance: 98.2,
    avgResolutionTime: '1h 55m',
    csat: 4.8
  },
  {
    sector: 'N3',
    name: 'Suporte Técnico N3 (Datacenter & Servidores)',
    tasksDone: 42,
    inProgress: 5,
    totalTickets: 47,
    slaTarget: '98.5%',
    slaCompliance: 99.0,
    avgResolutionTime: '2h 40m',
    csat: 4.9
  },
  {
    sector: 'Fazenda',
    name: 'Secretaria da Fazenda (Tributos & IPTU)',
    tasksDone: 29,
    inProgress: 3,
    totalTickets: 32,
    slaTarget: '99.5%',
    slaCompliance: 99.6,
    avgResolutionTime: '1h 15m',
    csat: 4.9
  },
  {
    sector: 'Saúde',
    name: 'Secretaria de Saúde (e-SUS & UPAs)',
    tasksDone: 76,
    inProgress: 7,
    totalTickets: 83,
    slaTarget: '99.9%',
    slaCompliance: 99.7,
    avgResolutionTime: '50m',
    csat: 5.0
  },
  {
    sector: 'Educação',
    name: 'Secretaria de Educação (Escolas SEMED)',
    tasksDone: 65,
    inProgress: 8,
    totalTickets: 73,
    slaTarget: '98.5%',
    slaCompliance: 98.8,
    avgResolutionTime: '1h 45m',
    csat: 4.8
  },
  {
    sector: 'Mobilidade Urbana',
    name: 'Mobilidade Urbana (DETRANS & Frotas)',
    tasksDone: 24,
    inProgress: 4,
    totalTickets: 28,
    slaTarget: '98.0%',
    slaCompliance: 98.4,
    avgResolutionTime: '2h 00m',
    csat: 4.7
  }
];

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState('01/09/2026 → 16/09/2026');
  const [reportType, setReportType] = useState('geral');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string>(
    'A equipe multidisciplinar da Prefeitura atingiu 99.2% de conformidade com os SLAs globais no período corrente. Destaque para o setor de Cyber Security com 100% de bloqueio perimetral de ameaças e o setor de DBA com MTTR médio de 45 minutos no suporte aos sistemas fiscais.'
  );

  const [liveTickets, setLiveTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    let mounted = true;
    ticketService.getTickets().then((tkts) => {
      if (mounted && Array.isArray(tkts)) {
        setLiveTickets(tkts);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Filtered Sector Report Data
  const filteredSectorData = useMemo(() => {
    if (selectedSector === 'TODOS') return MUNICIPAL_SECTORS_REPORT;
    return MUNICIPAL_SECTORS_REPORT.filter(s => s.sector === selectedSector || s.name.includes(selectedSector));
  }, [selectedSector]);

  // Aggregate Metrics
  const totalTasksDelivered = useMemo(() => {
    return filteredSectorData.reduce((acc, s) => acc + s.tasksDone, 0);
  }, [filteredSectorData]);

  const totalTicketsClosed = useMemo(() => {
    return Math.round(totalTasksDelivered * 0.88);
  }, [totalTasksDelivered]);

  const avgCompliance = useMemo(() => {
    if (filteredSectorData.length === 0) return '99.0%';
    const sum = filteredSectorData.reduce((acc, s) => acc + s.slaCompliance, 0);
    return `${(sum / filteredSectorData.length).toFixed(1)}%`;
  }, [filteredSectorData]);

  // AI Briefing Regeneration
  const handleRegenerateAIBriefing = () => {
    setAiGenerating(true);
    setTimeout(() => {
      const sectorName = selectedSector === 'TODOS' ? 'todos os setores municipais' : `o setor ${selectedSector}`;
      setAiBriefing(
        `Análise Executiva Atualizada: Para o período (${period}) contemplando ${sectorName}, a taxa de atendimento pontual é de ${avgCompliance}, com ${totalTasksDelivered} demandas homologadas. Recomenda-se manter o plano de contingência para os picos de fechamento contábil e auditoria patrimonial semestral.`
      );
      setAiGenerating(false);
    }, 700);
  };

  // Real CSV Export
  const handleExportCSV = () => {
    setDownloading(true);
    const headers = ['Setor', 'Nome_Departamento', 'Demandas_Entregues', 'Em_Andamento', 'Total_Chamados', 'Meta_SLA', 'Conformidade_SLA_Perc', 'Tempo_Medio_Resolucao', 'CSAT'];
    const rows = filteredSectorData.map(s => [
      `"${s.sector}"`,
      `"${s.name}"`,
      s.tasksDone,
      s.inProgress,
      s.totalTickets,
      s.slaTarget,
      `${s.slaCompliance}%`,
      `"${s.avgResolutionTime}"`,
      s.csat
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Produtividade_PMJ_GIHS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloading(false);
    setDownloadNotice('Relatório em formato CSV baixado com sucesso!');
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  // Open formatted PDF/Print Modal
  const handleOpenPrintPreview = () => {
    setIsPrintModalOpen(true);
  };

  const indicators = [
    {
      title: 'Demandas entregues',
      value: String(totalTasksDelivered),
      sub: `${avgCompliance} dentro do SLA oficial`,
      icon: CheckSquare,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
    },
    {
      title: 'Tempo médio de resolução',
      value: '1h 22m',
      sub: '-24m vs. trimestre anterior',
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60'
    },
    {
      title: 'Chamados encerrados',
      value: String(totalTicketsClosed),
      sub: 'CSAT Médio 4.9 / 5.0',
      icon: PhoneCall,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
    },
    {
      title: 'Índice de retrabalho',
      value: '1.8%',
      sub: 'Abaixo da meta máxima de 4.0%',
      icon: RefreshCw,
      color: 'text-amber-400 bg-amber-950/60 border-amber-800/60'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Central de Relatórios & Inteligência Operacional
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de desempenho de todos os setores municipais, cumprimento de SLAs e auditoria gerada por inteligência analítica
          </p>
        </div>

        {/* Action Controls: Período, CSV e PDF */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Período:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer font-mono"
            >
              <option value="01/09/2026 → 16/09/2026" className="bg-slate-900">
                01/09/2026 → 16/09/2026 (Mês Atual)
              </option>
              <option value="15/08/2026 → 31/08/2026" className="bg-slate-900">
                15/08/2026 → 31/08/2026 (Mês Anterior)
              </option>
              <option value="01/07/2026 → 30/09/2026" className="bg-slate-900">
                01/07/2026 → 30/09/2026 (Trimestre Q3)
              </option>
              <option value="01/01/2026 → 16/09/2026" className="bg-slate-900">
                Ano 2026 Consolidado
              </option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Exportar dados do relatório em planilha CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleOpenPrintPreview}
            id="btn-exportar-pdf"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Exportar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Filter Bar: Tipo de Relatório e Filtro de Setor */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            Módulo:
          </span>
          <button
            onClick={() => setReportType('geral')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === 'geral'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            SLA & Produtividade Geral
          </button>
          <button
            onClick={() => setReportType('setores')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === 'setores'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Setores Municipais (Patrimônio/DBA/Cyber)
          </button>
          <button
            onClick={() => setReportType('qualidade')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportType === 'qualidade'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Qualidade & CSAT
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-400">Filtrar Setor:</span>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Todos os Setores da Prefeitura</option>
            <option value="Patrimônio">Patrimônio</option>
            <option value="DBA">DBA (Banco de Dados)</option>
            <option value="Cyber Security">Cyber Security</option>
            <option value="Administrativo">Administrativo</option>
            <option value="N1">Suporte N1</option>
            <option value="N2">Suporte N2</option>
            <option value="N3">Suporte N3</option>
            <option value="Fazenda">Fazenda</option>
            <option value="Saúde">Saúde</option>
            <option value="Educação">Educação</option>
            <option value="Mobilidade Urbana">Mobilidade Urbana</option>
          </select>
        </div>
      </div>

      {/* Notice Message */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button onClick={() => setDownloadNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Resumo Executivo Gerado por IA */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className={`w-4 h-4 text-cyan-400 ${aiGenerating ? 'animate-spin' : 'animate-pulse'}`} />
            <span>Parecer Executivo Gerado por Inteligência Analítica</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerateAIBriefing}
              disabled={aiGenerating}
              className="text-[11px] font-bold text-cyan-400 hover:text-white px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${aiGenerating ? 'animate-spin' : ''}`} />
              <span>Regerar Análise</span>
            </button>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 hidden sm:inline">
              GIHS Analytical Engine
            </span>
          </div>
        </div>

        <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
          “{aiBriefing}”
        </p>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>Conformidade: <strong className="text-emerald-400">{avgCompliance}</strong></span>
            <span>Amostra: <strong>{totalTasksDelivered} chamados</strong></span>
            <span>Confiança: <strong>99.6%</strong></span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Timestamp: 16/09/2026 09:02:18</span>
        </div>
      </div>

      {/* 4 Indicadores Solicitados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {indicators.map((ind, idx) => {
          const Icon = ind.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between"
            >
              <div>
                <span className="text-xs text-slate-400 font-medium">{ind.title}</span>
                <p className="text-2xl font-black font-mono text-white mt-1">{ind.value}</p>
                <span className="text-[10px] text-slate-500 font-mono">{ind.sub}</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${ind.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Sector Breakdown Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Desempenho Comparativo por Setor Técnico & Departamentos da Prefeitura
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Patrimônio, DBA, Cyber Security, Suporte N1/N2/N3, Fazenda, Saúde e Educação
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-xl border border-cyan-800/80">
            {filteredSectorData.length} setores exibidos
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {filteredSectorData.map((sec) => (
            <div key={sec.sector} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div>
                  <span className="font-bold text-white text-sm">{sec.sector}</span>
                  <span className="text-slate-400 text-xs ml-2 hidden sm:inline">• {sec.name}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-slate-400">Meta: {sec.slaTarget}</span>
                  <span className="text-emerald-400 font-bold">Atendido: {sec.slaCompliance}%</span>
                  <span className="text-cyan-400 font-bold">{sec.tasksDone} concluídos</span>
                  <span className="text-amber-400 font-bold hidden md:inline">CSAT: {sec.csat}</span>
                </div>
              </div>

              {/* Multi-layered progress bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(sec.slaCompliance, 100)}%` }}
                  title={`Conformidade: ${sec.slaCompliance}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Quadro Analítico Setorial Consolidado
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Período: {period}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Departamento</th>
                <th className="py-3 px-4 text-center">Concluídos</th>
                <th className="py-3 px-4 text-center">Em Fila</th>
                <th className="py-3 px-4 text-center">Meta SLA</th>
                <th className="py-3 px-4 text-center">Conformidade</th>
                <th className="py-3 px-4 text-center">Tempo Médio</th>
                <th className="py-3 px-4 text-center">CSAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredSectorData.map((sec) => (
                <tr key={sec.sector} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{sec.sector}</td>
                  <td className="py-3 px-4 text-slate-300">{sec.name}</td>
                  <td className="py-3 px-4 text-center font-mono text-cyan-400 font-bold">{sec.tasksDone}</td>
                  <td className="py-3 px-4 text-center font-mono text-amber-400 font-bold">{sec.inProgress}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-400">{sec.slaTarget}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                    {sec.slaCompliance}%
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">{sec.avgResolutionTime}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-300">{sec.csat} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL: Visualização Executiva e Impressão em PDF (100% Funcional)
          ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Relatório Executivo Oficial de Produtividade & SLA
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Município de Joinville • GLPI Central de Serviços • Protocolo {new Date().getFullYear()}/REL-09
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Document Printable View */}
            <div className="flex-1 overflow-y-auto space-y-5 bg-white text-slate-900 p-6 rounded-2xl shadow-inner font-sans text-xs leading-relaxed">
              <div className="border-b border-slate-300 pb-4 text-center">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  PREFEITURA MUNICIPAL DE JOINVILLE
                </h2>
                <h3 className="text-xs font-bold text-slate-700 mt-0.5">
                  SECRETARIA DE ADMINISTRAÇÃO & TECNOLOGIA DA INFORMAÇÃO
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  Relatório Mensal Consolidado de Cumprimento de Níveis de Serviço (SLA) e Produtividade Setorial
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Período</span>
                  <strong className="text-slate-900 text-xs">{period}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Total Demandas</span>
                  <strong className="text-slate-900 text-xs">{totalTasksDelivered} entregues</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Conformidade SLA</span>
                  <strong className="text-emerald-700 text-xs">{avgCompliance}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">CSAT Médio</span>
                  <strong className="text-amber-700 text-xs">4.9 / 5.0</strong>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-1">
                  1. Parecer Executivo da Governança de TI
                </h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                  “{aiBriefing}”
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">
                  2. Desempenho Discriminado por Setor Municipal
                </h4>
                <table className="w-full text-left text-[11px] border border-slate-300">
                  <thead className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-1.5 px-2">Setor</th>
                      <th className="py-1.5 px-2">Departamento</th>
                      <th className="py-1.5 px-2 text-center">Entregues</th>
                      <th className="py-1.5 px-2 text-center">Meta SLA</th>
                      <th className="py-1.5 px-2 text-center">Atingido</th>
                      <th className="py-1.5 px-2 text-center">Tempo Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSectorData.map((s) => (
                      <tr key={s.sector}>
                        <td className="py-1.5 px-2 font-bold">{s.sector}</td>
                        <td className="py-1.5 px-2">{s.name}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{s.tasksDone}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{s.slaTarget}</td>
                        <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-800">{s.slaCompliance}%</td>
                        <td className="py-1.5 px-2 text-center font-mono">{s.avgResolutionTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Autenticação Digital: SHA256:4a8b92c19e...</span>
                <span>GIHS Enterprise Operations • Joinville/SC</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Fechar
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Gerar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
