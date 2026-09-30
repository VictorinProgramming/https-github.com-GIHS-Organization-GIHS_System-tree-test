import React, { useState } from 'react';
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
  FileText
} from 'lucide-react';
import { SECTOR_PRODUCTIVITY } from '../../data/mockData';

export const ReportsView: React.FC = () => {
  const [period, setPeriod] = useState('01/09/2026 → 16/09/2026');
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(false);

  const handleExportPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloadNotice(true);
      setTimeout(() => setDownloadNotice(false), 4000);
    }, 900);
  };

  const indicators = [
    {
      title: 'Tarefas entregues',
      value: '126',
      sub: '98% dentro do prazo',
      icon: CheckSquare,
      color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
    },
    {
      title: 'Tempo médio de resolução',
      value: '1h 45m',
      sub: '-18m vs. mês anterior',
      icon: Clock,
      color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60'
    },
    {
      title: 'Chamados fechados',
      value: '89',
      sub: 'CSAT 4.9 / 5.0',
      icon: PhoneCall,
      color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
    },
    {
      title: 'Taxa de retrabalho',
      value: '3.2%',
      sub: 'Abaixo da meta de 5%',
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
              Relatório de Produtividade da TI
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de desempenho, cumprimento de SLAs e análise preditiva gerada por inteligência artificial
          </p>
        </div>

        {/* Período & PDF Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Período:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer font-mono"
            >
              <option value="01/09/2026 → 16/09/2026" className="bg-slate-900">
                01/09/2026 → 16/09/2026
              </option>
              <option value="15/08/2026 → 31/08/2026" className="bg-slate-900">
                15/08/2026 → 31/08/2026
              </option>
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            id="btn-exportar-pdf"
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            {downloading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Exportar Relatório em PDF</span>
          </button>
        </div>
      </div>

      {/* PDF Export Notice */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Documento executivo <strong className="font-mono">Relatorio_Produtividade_GIHS_16092026.pdf</strong> gerado com sucesso!
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-300">Simulação Concluída</span>
        </div>
      )}

      {/* Resumo Executivo Gerado por IA (Prompt mandate) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>Resumo Executivo Gerado por IA</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            GIHS Agents LLM Engine
          </span>
        </div>

        <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
          “A equipe de TI atingiu 93% da meta estabelecida para o período, com destaque para a entrega das demandas do Back-End e o tempo de resposta do Suporte N3.”
        </p>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80 flex items-center gap-4">
          <span>Confiança do Modelo: <strong>99.4%</strong></span>
          <span>Tempo de processamento: <strong>0.38s</strong></span>
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Desempenho Comparativo por Setor Técnico
          </h3>
          <span className="text-xs font-mono text-slate-400">Metas Q3 2026</span>
        </div>

        <div className="space-y-3">
          {SECTOR_PRODUCTIVITY.map((sec) => (
            <div key={sec.sector} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{sec.sector}</span>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">SLA: {sec.SLA}</span>
                  <span className="text-cyan-400 font-bold">{sec.score}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${sec.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
