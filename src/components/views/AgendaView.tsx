import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { MOCK_CALENDAR_EVENTS, SECTORS } from '../../data/mockData';
import { CalendarEvent } from '../../types';

export const AgendaView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('semana');
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_CALENDAR_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(MOCK_CALENDAR_EVENTS[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New event form state
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('11:00 - 12:00');
  const [newSector, setNewSector] = useState(SECTORS[2]); // Suporte N2

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: newTitle || 'Alinhamento Operacional',
      time: newTime,
      duration: '1h',
      date: '16/09/2026',
      sector: newSector,
      type: 'Reunião',
      attendees: ['Victor Estevão', 'Equipe ' + newSector],
      location: 'Sala Virtual Meet GIHS'
    };
    setEvents([newEv, ...events]);
    setIsModalOpen(false);
    setNewTitle('');
    setToastMessage('✓ Evento agendado e sincronizado no calendário corporativo.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Agenda Corporativa</h1>
              <p className="text-xs text-slate-400">Quarta-feira, 16 de Setembro de 2026</p>
            </div>
          </div>
        </div>

        {/* Center / Right View Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Buttons */}
          <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('mes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('dia')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dia
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            id="btn-novo-evento"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo evento</span>
          </button>
        </div>
      </div>

      {/* Google Agenda Integration Planned Callout */}
      <div 
        id="google-agenda-callout"
        className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 shadow-md">
            {/* Google Calendar stylized colors */}
            <div className="w-full h-full rounded bg-blue-600 flex flex-col items-center justify-center text-[10px] font-bold text-white leading-none">
              <span className="text-[8px] uppercase">SET</span>
              <span className="text-xs">16</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Google Agenda</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Integração planejada
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sincronização bidirecional de reuniões técnicas com contas Google Workspace da empresa.
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            setToastMessage('ℹ Integração futura: O protótipo demonstra o endpoint de sincronização com Google Agenda.');
            setTimeout(() => setToastMessage(null), 4000);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-blue-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>Conectar Conta</span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </button>
      </div>

      {/* Toast notice */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Agenda Content Grid: Left Events Timeline, Right Selected Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schedule list */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-slate-400">
                Eventos de Hoje (16/09/2026)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                4 Reuniões
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500">Horário de Brasília (BRT)</span>
          </div>

          <div className="space-y-3">
            {events.map((ev) => {
              const isSelected = selectedEvent?.id === ev.id;
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-center shrink-0">
                      <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-slate-300 block leading-tight">
                        {ev.time.split('-')[0].trim()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white">{ev.title}</h3>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {ev.sector}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5 font-sans">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {ev.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {ev.attendees.length} participantes
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono text-cyan-400/90 font-semibold shrink-0">
                    {ev.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Event Detail / Room Preview */}
        <div className="lg:col-span-4 space-y-4">
          {selectedEvent && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block mb-1">
                  Detalhes da Reunião
                </span>
                <h3 className="font-bold text-base text-white">{selectedEvent.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.location}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Horário:</span>
                  <span className="font-mono font-bold text-white">{selectedEvent.time}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Setor Anfitrião:</span>
                  <span className="font-semibold text-cyan-300">{selectedEvent.sector}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Duração:</span>
                  <span className="font-mono text-slate-300">{selectedEvent.duration}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Participantes Confirmados ({selectedEvent.attendees.length}):
                </span>
                <div className="space-y-1.5">
                  {selectedEvent.attendees.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 text-xs text-slate-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-600 text-[10px] font-bold flex items-center justify-center text-white">
                        {att.charAt(0)}
                      </div>
                      <span>{att}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => {
                  setToastMessage(`✓ Link da sala copiado: https://meet.gihs.com.br/sala-${selectedEvent.id}`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                Entrar na Sala Virtual (Meet)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: + Novo Evento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Agendar Novo Evento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Evento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alinhamento Suporte e Infra"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horário
                </label>
                <input
                  type="text"
                  placeholder="11:00 - 12:00"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Setor
                </label>
                <select
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30"
                >
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
