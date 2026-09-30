import React, { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  UserX,
  Search,
  Filter,
  Edit,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet,
  Check,
  MapPin,
  Scan,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { PONTO_ADMIN_ROWS, SECTORS } from '../../data/mockData';
import { ViewScreen } from '../../types';
import { pontoService } from '../../services/pontoService';

interface PontoAdminViewProps {
  onNavigate: (screen: ViewScreen) => void;
}

export const PontoAdminView: React.FC<PontoAdminViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState(PONTO_ADMIN_ROWS);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [adjustModalRow, setAdjustModalRow] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = data.filter(row => {
    const matchSearch = row.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = sectorFilter === 'TODOS' || row.sector === sectorFilter;
    const matchStatus = statusFilter === 'TODOS' || row.status === statusFilter;
    return matchSearch && matchSector && matchStatus;
  });

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(`✓ Ajuste de ponto salvo para ${adjustModalRow.name}`);
    setAdjustModalRow(null);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Gestão de Ponto da Empresa</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoramento em tempo real do quadro funcional e auditoria de jornadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('espelho_ponto')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Abrir Espelho Geral
          </button>
        </div>
      </div>

      {/* 4 Cards Requested by User */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Colaboradores ativos */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Colaboradores ativos</span>
            <p className="text-2xl font-black font-mono text-white mt-1">48</p>
            <span className="text-[10px] text-slate-500 font-mono">100% cadastrados</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Presentes hoje */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Presentes hoje</span>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">44</p>
            <span className="text-[10px] text-emerald-400/80 font-mono">91.6% presença</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Em intervalo */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Em intervalo</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">6</p>
            <span className="text-[10px] text-amber-400/80 font-mono">Pausa de almoço</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <Coffee className="w-5 h-5" />
          </div>
        </div>

        {/* Ausentes */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Ausentes</span>
            <p className="text-2xl font-black font-mono text-rose-400 mt-1">4</p>
            <span className="text-[10px] text-rose-400/80 font-mono">2 folgas • 2 atestados</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/80">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar colaborador na folha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Setor: Todos</option>
            {SECTORS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="Presente">Presente</option>
            <option value="Intervalo">Intervalo</option>
            <option value="Ausente">Ausente</option>
          </select>
        </div>
      </div>

      {/* Table: Lista de colaboradores */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Entrada</th>
                <th className="py-3 px-4">Intervalo</th>
                <th className="py-3 px-4">Saída</th>
                <th className="py-3 px-4">Biometria, IP & Localização</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.map((row) => {
                const livePunches = pontoService.getTodayRecords(row.name);
                const lastPunch = livePunches[0];
                const ip = lastPunch?.ipAddress || lastPunch?.location?.ipAddress || '189.40.12.98';
                const loc = lastPunch?.location?.approximateAddress || 'São Paulo, SP (Aprox. 15m)';

                return (
                <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white font-sans">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                      {row.sector}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyan-300 font-semibold">{row.entry}</td>
                  <td className="py-3 px-4 text-slate-400">{row.breakTime}</td>
                  <td className="py-3 px-4 text-slate-400">{row.exit}</td>
                  <td className="py-3 px-4 font-sans">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono font-bold">
                          <Scan className="w-3 h-3 text-cyan-400" />
                          <span>Facial 99.4%</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800 font-mono">
                          <Globe className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{ip}</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 truncate max-w-[180px]" title={loc}>
                        <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{loc}</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      row.status === 'Presente'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : row.status === 'Intervalo'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAdjustModalRow(row)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Ajustar ponto"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onNavigate('espelho_ponto')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Ver espelho"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ajustar Ponto */}
      {adjustModalRow && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-cyan-400" />
                Ajuste Administrativo de Ponto
              </h3>
              <button
                onClick={() => setAdjustModalRow(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Colaborador:</span>
                <span className="text-sm font-bold text-white block">
                  {adjustModalRow.name} ({adjustModalRow.sector})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Entrada</label>
                  <input
                    type="text"
                    defaultValue={adjustModalRow.entry}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Intervalo</label>
                  <input
                    type="text"
                    defaultValue={adjustModalRow.breakTime}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Saída</label>
                  <input
                    type="text"
                    defaultValue={adjustModalRow.exit}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Justificativa Legal</label>
                <input
                  type="text"
                  placeholder="Ex: Esquecimento de registro / chamado externo em cliente"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalRow(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  Salvar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
