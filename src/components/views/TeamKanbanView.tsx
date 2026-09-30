import React, { useState, useEffect } from 'react';
import {
  Kanban as KanbanIcon,
  Filter,
  Calendar,
  MessageSquare,
  CheckSquare,
  Clock,
  Plus,
  Users,
  ChevronDown,
  CheckCircle2,
  Database,
  Trash2,
  X,
  ShieldCheck,
  CheckCheck,
  AlertTriangle,
  Edit,
  Tag,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { SECTORS, CURRENT_USER } from '../../data/mockData';
import { Task, TaskStatus, Sector, Priority, Collaborator, ViewScreen } from '../../types';
import { taskService } from '../../services/taskService';
import { apiBackendService } from '../../services/apiBackendService';
import { isLeadershipOrHigherRole } from '../../data/authCredentials';

interface TeamKanbanViewProps {
  currentUser?: Collaborator;
  onNavigate?: (screen: ViewScreen) => void;
}

export const TeamKanbanView: React.FC<TeamKanbanViewProps> = ({
  currentUser = CURRENT_USER,
  onNavigate
}) => {
  // Regra Estrita GIHS: Somente os maiores cargos (Gestores, Líderes, Diretoria) visualizam o Kanban da Equipe
  const hasAccess = isLeadershipOrHigherRole(currentUser);

  if (!hasAccess) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto my-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-xs font-bold mb-3">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Controle de Acesso (RBAC) • Gestão & Liderança</span>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2">
            Acesso Restrito: Kanban da Equipe
          </h3>

          <p className="text-xs text-slate-600 mb-6 leading-relaxed max-w-lg mx-auto">
            O <strong>Kanban da Equipe</strong> é restrito exclusivamente aos <strong>maiores cargos da organização</strong> (Diretoria Executiva, Tech Leads, Gestores e Líderes de Setor) para supervisão do backlog coletivo e validação de entregas.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-6 space-y-2 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Usuário Conectado:</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Cargo Atual:</span>
              <span className="font-bold text-[#37558d]">{currentUser.role || 'Colaborador Operacional'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Seu Espaço Individual:</span>
              <span className="font-bold text-emerald-700">Meu Kanban (Individual)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('meu_kanban')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <KanbanIcon className="w-4 h-4" />
                <span>Ir para Meu Kanban Individual</span>
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <span>Voltar ao Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  const [selectedSector, setSelectedSector] = useState<string>(
    currentUser.sector || 'N1'
  );
  const [selectedWeek, setSelectedWeek] = useState('Semana Atual (Operacional)');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeTaskDetail, setActiveTaskDetail] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser.name);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Alta');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Subscribe in real-time to PostgreSQL tasks and fetch users
  useEffect(() => {
    const unsubscribe = taskService.subscribeTasks((allTasks) => {
      setTasks(allTasks);
      setLoading(false);
    });

    apiBackendService.getUsers().then((res) => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setCollaborators(res.data);
      }
    }).catch(err => {
      console.warn('PostgreSQL users fetch error in TeamKanban:', err);
    });

    return () => unsubscribe();
  }, []);

  const teamColumns: { id: TaskStatus; label: string; countBadge: string }[] = [
    { id: 'A_FAZER', label: 'A FAZER', countBadge: 'bg-blue-50 text-[#37558d] border-blue-200' },
    { id: 'EM_ANDAMENTO', label: 'EM ANDAMENTO', countBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'EM_REVISAO', label: 'EM REVISÃO', countBadge: 'bg-amber-50 text-amber-800 border-amber-300' },
    { id: 'CONCLUIDO', label: 'CONCLUÍDO', countBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ];

  const currentSectorTasks = tasks.filter(t => 
    selectedSector === 'TODOS'
      ? true
      : (t.sector && t.sector.toLowerCase() === selectedSector.toLowerCase()) ||
        (!t.sector && selectedSector === 'N1')
  );

  const handleUpdateStatus = async (taskId: string, targetStatus: TaskStatus) => {
    const currentTask = tasks.find(t => t.id === taskId);
    const isMovingToReview = targetStatus === 'EM_REVISAO';

    setTasks(prev => prev.map(t => t.id === taskId ? {
      ...t,
      status: targetStatus,
      reviewStatus: isMovingToReview ? 'PENDING_VALIDATION' : t.reviewStatus
    } : t));

    try {
      await taskService.updateTaskStatus(taskId, targetStatus);
      if (isMovingToReview) {
        setFeedback(`✓ "${currentTask?.title || 'Tarefa'}" enviada para validação do Líder de setor!`);
      } else {
        setFeedback(`✓ Tarefa movida para ${targetStatus.replace('_', ' ')} no PostgreSQL.`);
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const handleCreateTeamTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await taskService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || `Demanda coletiva da squad ${selectedSector}.`,
        sector: (selectedSector as Sector) || 'N1',
        assigneeName: newTaskAssignee || currentUser.name,
        priority: newTaskPriority,
        status: 'A_FAZER',
        deadline: newTaskDeadline || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        tag: selectedSector,
        commentsCount: 0,
        subtasks: [
          { id: 'sub-1', title: 'Triagem técnica inicial', done: false },
          { id: 'sub-2', title: 'Execução e testes em homologação', done: false }
        ]
      });

      setTasks(prev => [created, ...prev]);
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDeadline('');
      setFeedback('✓ Nova tarefa de equipe gravada com sucesso no PostgreSQL!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao criar tarefa no PostgreSQL:', err);
      setFeedback('Erro ao gravar no PostgreSQL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (taskId: string, title: string) => {
    setTaskToDelete({ id: taskId, title });
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setIsDeleting(true);

    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTaskDetail?.id === id) setActiveTaskDetail(null);

    try {
      await taskService.deleteTask(id);
      setFeedback(`✓ Tarefa "${title}" excluída com sucesso do PostgreSQL.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Leader Validates Task: moves automatically to "Concluído"
  const handleLeaderValidate = async (task: Task) => {
    try {
      const leaderName = currentUser.name || 'Líder do Setor';
      const updated = await taskService.validateTaskByLeader(
        task.id,
        leaderName,
        `Homologado por ${leaderName}`
      );
      if (updated) {
        setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
      }
      setFeedback(`✓ Tarefa "${task.title}" validada pelo Líder e movida automaticamente para Concluído!`);
      setTimeout(() => setFeedback(null), 4500);
      if (activeTaskDetail?.id === task.id && updated) {
        setActiveTaskDetail(updated);
      }
    } catch (err) {
      console.error('Erro na validação do líder:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="main-teamkanban-container">
      {/* Top Banner no padrão do Dashboard: Div Branca */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-[#37558d]/10 border border-[#37558d]/20 text-[#37558d]">
              <KanbanIcon className="w-5 h-5 text-[#37558d]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                  Kanban da Equipe
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>PostgreSQL</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Fluxo colaborativo de trabalho e distribuição de tarefas sincronizado no PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        {/* Seletores e Ação de Nova Tarefa em estilo limpo */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Setor */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-500">Setor:</span>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-transparent font-bold text-[#37558d] focus:outline-none cursor-pointer"
            >
              <option value="TODOS">TODOS OS SETORES</option>
              {SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Nova Tarefa */}
          <button
            type="button"
            onClick={() => setIsNewTaskModalOpen(true)}
            id="btn-nova-tarefa-equipe"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#37558d] hover:bg-[#2c4471] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Informativo do Fluxo de Validação em Div Branca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#37558d] shrink-0" />
          <span className="font-semibold text-slate-700">
            Regra Operacional:
          </span>
          <span className="text-slate-600">
            Tarefas em <strong>Em Revisão</strong> aguardam validação do Líder do setor. Uma vez validadas, vão automaticamente para <strong>Concluído</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-[#37558d] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 whitespace-nowrap self-start sm:self-auto">
          {currentSectorTasks.length} Tarefas no Setor
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 Colunas do Kanban da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teamColumns.map((col) => {
          const colTasks = currentSectorTasks.filter(t => t.status === col.id);
          const isReview = col.id === 'EM_REVISAO';

          return (
            <div
              key={col.id}
              className={`rounded-3xl p-4 flex flex-col min-h-[580px] shadow-sm transition-all border ${
                isReview ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-200'
              }`}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  {isReview && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.countBadge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-center p-3">
                    <span className="text-[11px] text-slate-400 font-semibold">Sem tarefas no momento</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isPendingValidation = task.status === 'EM_REVISAO';
                    const isDone = task.status === 'CONCLUIDO';

                    return (
                      <div
                        key={task.id}
                        onClick={() => setActiveTaskDetail(task)}
                        className={`p-4 rounded-2xl bg-white border transition-all shadow-xs group cursor-pointer relative flex flex-col justify-between gap-2.5 ${
                          isPendingValidation
                            ? 'border-amber-300 hover:border-amber-400 hover:shadow-md ring-2 ring-amber-400/20'
                            : 'border-slate-200 hover:border-[#37558d]/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${
                            task.priority === 'Crítica'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'Alta'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-[#37558d] border-blue-200'
                          }`}>
                            {task.priority}
                          </span>

                          <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                            {task.sector}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-[#37558d] transition-colors">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Se estiver Em Revisão: Selo + Botão de validação do líder */}
                        {isPendingValidation && (
                          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Aguardando Validação do Líder</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLeaderValidate(task);
                              }}
                              className="w-full mt-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                              title="Validar e concluir automaticamente"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Validar e Concluir</span>
                            </button>
                          </div>
                        )}

                        {/* Selo se já concluído */}
                        {isDone && task.reviewedBy && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">Validado por {task.reviewedBy}</span>
                          </div>
                        )}

                        {/* Controles de avanço de status */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700 truncate max-w-[110px]">
                            {task.assigneeName}
                          </span>

                          <div className="flex items-center gap-1">
                            {task.status !== 'A_FAZER' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const prevMap: Record<TaskStatus, TaskStatus> = {
                                    'EM_ANDAMENTO': 'A_FAZER',
                                    'EM_REVISAO': 'EM_ANDAMENTO',
                                    'CONCLUIDO': 'EM_REVISAO',
                                    'A_FAZER': 'A_FAZER',
                                    'BACKLOG': 'BACKLOG'
                                  };
                                  handleUpdateStatus(task.id, prevMap[task.status]);
                                }}
                                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-bold cursor-pointer"
                                title="Voltar coluna"
                              >
                                ←
                              </button>
                            )}

                            {task.status !== 'CONCLUIDO' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextMap: Record<TaskStatus, TaskStatus> = {
                                    'A_FAZER': 'EM_ANDAMENTO',
                                    'EM_ANDAMENTO': 'EM_REVISAO',
                                    'EM_REVISAO': 'CONCLUIDO',
                                    'CONCLUIDO': 'CONCLUIDO',
                                    'BACKLOG': 'A_FAZER'
                                  };
                                  handleUpdateStatus(task.id, nextMap[task.status]);
                                }}
                                className="px-2 py-0.5 bg-[#37558d] hover:bg-[#2c4471] text-white rounded font-bold cursor-pointer"
                                title="Avançar coluna"
                              >
                                {task.status === 'EM_ANDAMENTO' ? 'Revisão →' : '→'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: NOVA TAREFA EQUIPE */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KanbanIcon className="w-5 h-5 text-[#37558d]" />
                <h3 className="text-base font-black text-slate-900">
                  Nova Tarefa da Equipe (PostgreSQL)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTaskModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeamTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Demanda *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Auditoria de acessos SSH e atualização de certificados"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={3}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Instruções operacionais e tarefas técnicas..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Responsável (Atribuído a)
                  </label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#37558d]"
                  >
                    <option value={currentUser.name}>{currentUser.name} (Você)</option>
                    {collaborators.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.sector || 'Geral'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#37558d]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data Limite (Prazo)
                </label>
                <input
                  type="date"
                  value={newTaskDeadline}
                  onChange={(e) => setNewTaskDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#37558d]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DA TAREFA */}
      {activeTaskDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#37558d] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  {activeTaskDetail.id}
                </span>
                <span className="text-xs font-bold text-slate-500">• Setor {activeTaskDetail.sector}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTaskDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                {activeTaskDetail.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {activeTaskDetail.description || 'Sem descrição detalhada.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Responsável:</span>
                <span className="font-bold text-slate-800">{activeTaskDetail.assigneeName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Prioridade:</span>
                <span className="font-bold text-slate-800">{activeTaskDetail.priority}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Status:</span>
                <span className="font-bold text-[#37558d]">{activeTaskDetail.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Prazo:</span>
                <span className="font-bold text-slate-800">{activeTaskDetail.deadline || 'Não informado'}</span>
              </div>
            </div>

            {activeTaskDetail.status === 'EM_REVISAO' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Esta tarefa está aguardando homologação do Líder do setor.</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleLeaderValidate(activeTaskDetail)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Validar Entrega e Concluir Automaticamente</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteTask(activeTaskDetail.id, activeTaskDetail.title)}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTaskDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE TAREFA */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Excluir Tarefa da Equipe?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ação definitiva no PostgreSQL
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Tarefa selecionada:</span>
              <p className="font-semibold text-slate-900 text-sm">
                "{taskToDelete.title}"
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja excluir esta tarefa permanentemente do banco de dados relacional? Ela deixará de constar no quadro da equipe.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirmar-exclusao-tarefa-equipe"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
