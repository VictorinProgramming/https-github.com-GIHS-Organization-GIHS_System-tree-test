import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  X,
  BookOpen,
  Search,
  Tag,
  Clock,
  FileSpreadsheet,
  Building2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Users,
  UserCheck,
  Handshake,
  Edit3,
  List
} from 'lucide-react';
import { SupportTicket, KnowledgeArticle, Collaborator } from '../../../types';
import { activitySyncService } from '../../../services/activitySyncService';
import { taskService } from '../../../services/taskService';
import { dbService } from '../../../services/dbService';
import { apiBackendService } from '../../../services/apiBackendService';
import { USER_CREDENTIALS } from '../../../data/authCredentials';

interface TicketFinalizeModalProps {
  ticket: SupportTicket;
  currentUser: Collaborator;
  kbArticles?: KnowledgeArticle[];
  onClose: () => void;
  onSuccess: (data: { ticket: SupportTicket; activityId: string }) => void;
}

export const TicketFinalizeModal: React.FC<TicketFinalizeModalProps> = ({
  ticket,
  currentUser,
  kbArticles: passedKbArticles,
  onClose,
  onSuccess
}) => {
  // Safe resolution of KB articles
  const articlesList = useMemo<KnowledgeArticle[]>(() => {
    if (Array.isArray(passedKbArticles) && passedKbArticles.length > 0) {
      return passedKbArticles;
    }
    const fromSync = activitySyncService.getKnowledgeBase();
    if (Array.isArray(fromSync) && fromSync.length > 0) {
      return fromSync;
    }
    return [];
  }, [passedKbArticles]);

  // Lista de técnicos e colaboradores disponíveis para o Campo de Colaboração
  const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>(() => {
    return USER_CREDENTIALS.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.roleLabel || u.role,
      userRole: u.role,
      sector: u.sector as any,
      status: u.status,
      avatar: u.avatar,
      currentTask: u.currentTask,
      phone: u.phone,
      admissionDate: u.admissionDate
    }));
  });
  const [participantCollaborator, setParticipantCollaborator] = useState<string>(ticket.participantCollaborator || '');
  const [isManualInput, setIsManualInput] = useState<boolean>(false);

  useEffect(() => {
    const unsub = dbService.subscribeUsers((users) => {
      if (users && users.length > 0) {
        setAvailableCollaborators(prev => {
          const map = new Map<string, Collaborator>();
          prev.forEach(u => map.set(u.name, u));
          users.forEach(u => map.set(u.name, u));
          return Array.from(map.values());
        });
      }
    });

    apiBackendService.getUsers().then(res => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableCollaborators(prev => {
          const map = new Map<string, Collaborator>();
          prev.forEach(u => map.set(u.name, u));
          res.data.forEach((u: any) => {
            if (u && u.name) {
              map.set(u.name, {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                userRole: u.user_role || u.userRole,
                sector: u.sector_name || u.sector,
                status: u.status,
                avatar: u.avatar_url || u.avatar,
                currentTask: u.current_task,
                phone: u.phone,
                admissionDate: u.admission_date
              } as Collaborator);
            }
          });
          return Array.from(map.values());
        });
      }
    }).catch(() => {});

    return () => unsub();
  }, []);

  // Service Types based on sector
  const defaultServiceTypes = useMemo(() => {
    const sec = (ticket?.sector || '').toLowerCase();
    if (sec.includes('n1')) {
      return [
        'Redefinição de Senha & Acesso',
        'Suporte a Estação de Trabalho & Periféricos',
        'Configuração de E-mail / Outlook / Navegador',
        'Instalação de Softwares Homologados',
        'Triagem & Atendimento N1'
      ];
    }
    if (sec.includes('n2')) {
      return [
        'Diagnóstico Avançado de Hardware',
        'Configuração de VPN & Rede Local',
        'Configuração de Switch / Roteador / Wi-Fi',
        'Gerenciamento de Usuários no Active Directory',
        'Suporte a Impressoras de Rede & Servidores'
      ];
    }
    if (sec.includes('n3')) {
      return [
        'Configuração de Firewall & Políticas de Segurança',
        'Manutenção de Servidores Linux / Windows Server',
        'Deploy e Atualização de Infraestrutura Cloud',
        'Análise de Logs Críticos & Alta Disponibilidade',
        'Investigação de Incidentes de Segurança'
      ];
    }
    if (sec.includes('patrim')) {
      return [
        'Tombamento & Emissão de Etiqueta de Patrimônio',
        'Inventário Físico & Auditoria de Ativos',
        'Termo de Entrega / Devolução de Equipamento',
        'Baixa Patrimonial & Descarte de Ativos',
        'Remanejamento de Equipamentos entre Setores'
      ];
    }
    return [
      'Atendimento Help Desk Geral',
      'Configuração de Acessos & Rede',
      'Manutenção Preventiva / Corretiva',
      'Resolução de Falha de Software',
      'Substituição de Hardware & Periféricos'
    ];
  }, [ticket?.sector]);

  const [serviceType, setServiceType] = useState<string>(defaultServiceTypes[0] || 'Atendimento Help Desk Geral');
  const [selectedKbArticle, setSelectedKbArticle] = useState<KnowledgeArticle | null>(null);
  const [kbSearch, setKbSearch] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [timeSpent, setTimeSpent] = useState('00h 45m');
  const [saveAsNewKb, setSaveAsNewKb] = useState(false);
  const [newKbTitle, setNewKbTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter KB articles based on search or sector relevance (strictly safe against undefined)
  const filteredKbArticles = useMemo(() => {
    if (!Array.isArray(articlesList)) return [];
    const query = (kbSearch || '').toLowerCase().trim();
    return articlesList.filter(art => {
      if (!art) return false;
      const title = (art.title || '').toLowerCase();
      const summary = (art.summarySolution || '').toLowerCase();
      const code = (art.code || '').toLowerCase();
      const tags = Array.isArray(art.tags) ? art.tags : [];
      return (
        !query ||
        title.includes(query) ||
        summary.includes(query) ||
        code.includes(query) ||
        tags.some(t => (t || '').toLowerCase().includes(query))
      );
    });
  }, [articlesList, kbSearch]);

  // Recommended articles for the ticket sector
  const recommendedKbArticles = useMemo(() => {
    if (!Array.isArray(articlesList)) return [];
    const secNorm = (ticket?.sector || '').replace('Suporte ', '').trim().toLowerCase();
    return articlesList
      .filter(art => art && (art.sector || '').toLowerCase().includes(secNorm))
      .slice(0, 3);
  }, [articlesList, ticket?.sector]);

  const handleSelectKbArticle = (article: KnowledgeArticle) => {
    setSelectedKbArticle(article);
    setServiceType(article.serviceType);
    setResolutionSummary(article.summarySolution);
    const hours = Math.floor(article.estimatedResolutionMinutes / 60);
    const mins = article.estimatedResolutionMinutes % 60;
    setTimeSpent(`${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
  };

  const handleClearSelectedKb = () => {
    setSelectedKbArticle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !resolutionSummary.trim()) return;

    setIsSubmitting(true);
    try {
      const participantObj = availableCollaborators.find(c => c.name === participantCollaborator);
      const result = activitySyncService.finalizeTicket({
        ticketId: ticket.id,
        ticket,
        currentUser,
        serviceType,
        resolutionSummary: resolutionSummary.trim(),
        timeSpent: timeSpent || '00h 45m',
        kbArticleId: selectedKbArticle?.id,
        saveToKb: saveAsNewKb,
        newKbTitle: newKbTitle.trim() || `Resolução: ${ticket.subject || ticket.title || ticket.id}`,
        participantCollaborator: participantCollaborator.trim() || undefined,
        participantCollaboratorId: participantObj?.id,
        participantCollaboratorAvatar: participantObj?.avatar
      });

      // Direct persist into activities for current user
      try {
        await taskService.createActivity({
          date: result.activity.date,
          time: result.activity.time,
          collaborator: currentUser.name,
          sector: ticket.sector || currentUser.sector || 'N1',
          activity: `[Chamado ${ticket.id}] ${ticket.subject || ticket.title || 'Chamado'} — ${serviceType}`,
          priority: ticket.priority || 'Média',
          status: 'Concluído',
          timeSpent: timeSpent || '00h 45m',
          observation: `Solução: ${resolutionSummary.trim()}. Solicitante: ${ticket.client || ticket.requester || 'Cliente'}. Chamado #${ticket.id} fechado no Help Desk.`,
          attachment: `laudo-resolucao-${ticket.id}.pdf`
        });

        // Se houve colaborador participante, gera também a atividade para ele (computada como fechamento de chamado)
        if (result.participantActivity) {
          await taskService.createActivity(result.participantActivity);
        }
      } catch (errAct) {
        console.warn('Error saving closed ticket activity:', errAct);
      }

      onSuccess({
        ticket: result.ticket,
        activityId: result.activity.id
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Finalizar Chamado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#37558d] border border-blue-200">
                  {ticket.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Fases 5 & 6
                </span>
              </div>
              <p className="text-xs text-[#37558d] font-medium mt-0.5">
                Fechamento técnico com laudo, Base de Conhecimento e Registro de Atividade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Ticket Summary Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-600 font-medium">
                Cliente / Solicitante: <strong className="text-slate-900">{ticket.client}</strong>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[#37558d] font-mono font-semibold">
                  {ticket.sector}
                </span>
                <span className={`px-2 py-0.5 rounded-lg font-bold ${
                  ticket.priority === 'Crítica'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : ticket.priority === 'Alta'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <p className="font-bold text-[#37558d] text-sm">
              {ticket.subject || ticket.title}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5 font-mono">
              <span>
                Especialista responsável: <strong className="text-[#37558d]">{currentUser.name}</strong> ({currentUser.sector})
              </span>
            </div>
          </div>

          {/* 1. Tipo do Serviço Realizado */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#37558d]" />
                Tipo do Serviço Realizado *
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Classificação operacional</span>
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all font-sans"
              required
            >
              {defaultServiceTypes.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
              <option value="Outro Serviço Especializado">Outro Serviço Especializado</option>
            </select>
          </div>

          {/* 2. Base de Conhecimento Picker (Fase 6) */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#37558d] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#37558d]" />
                <span>Fase 6 • Solução da Base de Conhecimento</span>
              </label>
              {selectedKbArticle && (
                <button
                  type="button"
                  onClick={handleClearSelectedKb}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer"
                >
                  Desvincular artigo
                </button>
              )}
            </div>

            {selectedKbArticle ? (
              /* Selected Article Card */
              <div className="p-3.5 rounded-xl bg-white border border-blue-300 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#37558d] font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                      {selectedKbArticle.code}
                    </span>
                    <span className="font-bold text-slate-900">{selectedKbArticle.title}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {selectedKbArticle.usefulCount} resoluções
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedKbArticle.summarySolution}
                </p>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 font-mono">
                  <span>Setor: <strong className="text-slate-700">{selectedKbArticle.sector}</strong></span>
                  <span>•</span>
                  <span>Tempo médio: <strong className="text-slate-700">{selectedKbArticle.estimatedResolutionMinutes} min</strong></span>
                  <span>•</span>
                  <span>Autor: <strong className="text-slate-700">{selectedKbArticle.author}</strong></span>
                </div>
              </div>
            ) : (
              /* Search & Recommendations */
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar procedimentos padrão, códigos (ex: N1-AUTH, N2-NET)..."
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d]"
                  />
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  <span className="text-[10px] text-[#37558d] block font-bold uppercase tracking-wider">
                    {kbSearch ? 'Resultados da Base de Conhecimento:' : `Soluções Sugeridas para ${ticket.sector}:`}
                  </span>
                  {(kbSearch ? filteredKbArticles.slice(0, 4) : recommendedKbArticles).map(art => (
                    <div
                      key={art.id}
                      onClick={() => handleSelectKbArticle(art)}
                      className="p-2.5 rounded-xl bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all flex items-center justify-between text-xs group shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#37558d] font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md">
                          {art.code}
                        </span>
                        <span className="text-slate-800 font-semibold group-hover:text-[#37558d] line-clamp-1">
                          {art.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {art.estimatedResolutionMinutes}m
                        </span>
                        <span className="text-[10px] text-[#37558d] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Usar Solução
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Resumo da Solução Realizada */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Laudo Técnico & Resumo da Solução Realizada *</span>
              <span className="text-[10px] text-slate-400 font-normal">Será registrado na timeline</span>
            </label>
            <textarea
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              placeholder="Descreva de modo conciso o procedimento técnico executado para solucionar o chamado..."
              rows={3}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all resize-none font-sans"
            />
          </div>

          {/* Campo de Colaboração: Técnico que auxiliou no fechamento do chamado */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#37558d] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#37558d]" />
                <span>Campo de Colaboração (Técnico que auxiliou no fechamento)</span>
              </label>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-[#37558d] font-extrabold border border-blue-300">
                +1 Fechamento na Base & Excel
              </span>
            </div>

            {/* Alternar entre Selecionar da Equipe e Inserir Manualmente */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{isManualInput ? 'Inserir técnico livremente (digitação):' : 'Selecione o técnico ou digite o nome:'}</span>
              <button
                type="button"
                onClick={() => setIsManualInput(!isManualInput)}
                className="text-[#37558d] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                {isManualInput ? (
                  <>
                    <List className="w-3 h-3" />
                    <span>Selecionar da lista da equipe</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Digitar / Inserir nome manualmente</span>
                  </>
                )}
              </button>
            </div>

            {isManualInput ? (
              <div className="relative">
                <input
                  type="text"
                  value={participantCollaborator}
                  onChange={(e) => setParticipantCollaborator(e.target.value)}
                  placeholder="Insira o nome do técnico que auxiliou no fechamento..."
                  list="datalist-tecnicos-colaboradores"
                  id="input-tecnico-colaborador-manual"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#37558d] placeholder-slate-400"
                />
                <datalist id="datalist-tecnicos-colaboradores">
                  {availableCollaborators
                    .filter((c) => c.name !== currentUser.name)
                    .map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name} ({c.sector} • {c.role})
                      </option>
                    ))}
                </datalist>
              </div>
            ) : (
              <select
                value={participantCollaborator}
                onChange={(e) => setParticipantCollaborator(e.target.value)}
                id="select-colaborador-participante-fechamento"
                className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#37558d] cursor-pointer"
              >
                <option value="">Nenhum (Fechamento individual por {currentUser.name})</option>
                {availableCollaborators
                  .filter((c) => c.name !== currentUser.name)
                  .map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name} ({c.sector} • {c.role})
                    </option>
                  ))}
              </select>
            )}

            {/* Chips rápidos de sugestões de técnicos para inserir com 1 clique */}
            {availableCollaborators.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-500 font-semibold">Sugestões rápidas:</span>
                {availableCollaborators
                  .filter((c) => c.name !== currentUser.name)
                  .slice(0, 4)
                  .map((c) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      onClick={() => setParticipantCollaborator(c.name)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                        participantCollaborator === c.name
                          ? 'bg-[#37558d] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                {participantCollaborator && (
                  <button
                    type="button"
                    onClick={() => setParticipantCollaborator('')}
                    className="text-[10px] text-rose-600 hover:underline font-semibold ml-1 cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-white/90 border border-blue-100 text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed">
              <Sparkles className="w-3.5 h-3.5 text-[#37558d] shrink-0 mt-0.5" />
              <span>
                <strong>Regra de Colaboração:</strong> Ao inserir o técnico que auxiliou no atendimento, este chamado será automaticamente contado como <strong>fechamento de chamado para ele</strong> na <strong>Base de Atividades</strong> (Help Desk e Smart Spreadsheet) e na geração da <strong>Planilha em Excel (.xlsx)</strong> dele.
              </span>
            </div>
          </div>

          {/* 4. Tempo Gasto e Salvar na KB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#37558d]" />
                Tempo Gasto no Atendimento *
              </label>
              <input
                type="text"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="Ex: 00h 45m"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d]"
                required
              />
            </div>

            {!selectedKbArticle && (
              <div className="pt-2 sm:pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold">
                  <input
                    type="checkbox"
                    checked={saveAsNewKb}
                    onChange={(e) => setSaveAsNewKb(e.target.checked)}
                    className="rounded border-slate-300 text-[#37558d] focus:ring-[#37558d] cursor-pointer"
                  />
                  <span>Catalogar como novo artigo na Base de Conhecimento</span>
                </label>
              </div>
            )}
          </div>

          {/* Title for new KB article if checked */}
          {saveAsNewKb && (
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-[#37558d] mb-1">
                Título do Novo Artigo da Base de Conhecimento
              </label>
              <input
                type="text"
                value={newKbTitle}
                onChange={(e) => setNewKbTitle(e.target.value)}
                placeholder={`Ex: Resolução de ${ticket.subject}`}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
              />
            </div>
          )}

          {/* 5. Highlight notice: Integration with Formulários & Registro de Atividades */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">
                Vínculo Automático com Banco de Atividades & Excel
              </p>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Ao finalizar, o sistema gera automaticamente uma atividade vinculada ao colaborador{' '}
                <strong className="text-emerald-950 font-semibold">({currentUser.name})</strong> e ao setor{' '}
                <strong className="text-emerald-950 font-semibold">({currentUser.sector})</strong>, pronta para ser filtrada e exportada.
              </p>
            </div>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Chamado: <strong className="text-slate-800">{ticket.id}</strong> • Operador: <strong className="text-slate-800">{currentUser.name}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting || !resolutionSummary.trim()}
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span className="text-white">
                {isSubmitting ? 'Encerrando Chamado...' : 'Finalizar Chamado & Gerar Atividade'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
