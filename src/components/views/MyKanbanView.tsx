import React, { useState, useEffect } from 'react';
import {
  Kanban as KanbanIcon,
  Plus,
  Clock,
  Tag,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  Filter,
  Layers,
  Sparkles,
  Trash2,
  Edit,
  Database,
  ShieldCheck,
  UserCheck,
  CheckCheck,
  AlertTriangle,
  X,
  FileText,
  Calendar,
  Users
} from 'lucide-react';
import { CURRENT_USER } from '../../data/mockData';
import { Task, TaskStatus, Priority, Collaborator, Sector, ViewScreen } from '../../types';
import { taskService } from '../../services/taskService';
import { isLeadershipOrHigherRole } from '../../data/authCredentials';

interface MyKanbanViewProps {
  currentUser?: Collaborator;
  onNavigate?: (screen: ViewScreen) => void;
}

export const MyKanbanView: React.FC<MyKanbanViewProps> = ({
  currentUser = CURRENT_USER,
  onNavigate
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Modals state
  const [newTaskModal, setNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Média');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('Média');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTag, setEditTag] = useState('');

  // Validation modal by leader
  const [validatingTask, setValidatingTask] = useState<Task | null>(null);
  const [validationNotes, setValidationNotes] = useState('');

  // Delete Confirmation Modal state
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current user holds a leadership/higher role
  const isLeaderOrAdmin = React.useMemo(() => {
    return isLeadershipOrHigherRole(currentUser);
  }, [currentUser]);

  // Subscribe to tasks in PostgreSQL - ESTRITAMENTE INDIVIDUAL
  useEffect(() => {
    const unsubscribe = taskService.subscribeTasks((allTasks) => {
      // Regra de Negócio: O Kanban é individual (um kanban para cada um).
      // Cada usuário visualiza exclusivamente as suas próprias tarefas atribuídas.
      const myTasks = allTasks.filter(t => {
        if (t.assigneeId && currentUser.id && String(t.assigneeId) === String(currentUser.id)) {
          return true;
        }
        if (!t.assigneeName || !currentUser.name) return false;

        const tName = t.assigneeName.toLowerCase().trim();
        const uName = currentUser.name.toLowerCase().trim();
        if (tName === uName) return true;

        // Normalização sem acentos e espaços extras
        const normT = tName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
        const normU = uName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
        if (normT === normU) return true;

        const partsT = normT.split(' ');
        const partsU = normU.split(' ');
        if (partsT.length >= 2 && partsU.length >= 2) {
          if (partsT[0] === partsU[0] && partsT[partsT.length - 1] === partsU[partsU.length - 1]) return true;
        }
        return false;
      });
      setTasks(myTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const columns: { id: TaskStatus; label: string; countBadge: string }[] = [
    { id: 'BACKLOG', label: 'BACKLOG', countBadge: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'A_FAZER', label: 'A FAZER', countBadge: 'bg-blue-50 text-[#37558d] border-blue-200' },
    { id: 'EM_ANDAMENTO', label: 'EM ANDAMENTO', countBadge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'EM_REVISAO', label: 'EM REVISÃO', countBadge: 'bg-amber-50 text-amber-800 border-amber-300' },
    { id: 'CONCLUIDO', label: 'CONCLUÍDO', countBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  ];

  // Move task (Drag & Drop or button)
  const moveTask = async (taskId: string, targetStatus: TaskStatus) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    // Optimistic update
    const isMovingToReview = targetStatus === 'EM_REVISAO';
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              reviewStatus: isMovingToReview ? 'PENDING_VALIDATION' : t.reviewStatus
            }
          : t
      )
    );

    if (isMovingToReview) {
      setFeedback(
        `✓ "${currentTask.title}" movida para Em Revisão! Enviada para o Líder do setor validar.`
      );
    } else {
      setFeedback(`✓ "${currentTask.title}" movida para ${targetStatus.replace('_', ' ')}.`);
    }
    setTimeout(() => setFeedback(null), 4500);

    try {
      await taskService.updateTaskStatus(taskId, targetStatus);
    } catch (err) {
      console.error('Erro ao atualizar status no PostgreSQL:', err);
      // Revert if error
      const fresh = await taskService.getTasks();
      setTasks(fresh);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (colId: TaskStatus) => {
    if (draggedTaskId) {
      moveTask(draggedTaskId, colId);
      setDraggedTaskId(null);
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await taskService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || 'Nova tarefa inserida no fluxo de trabalho individual.',
        sector: (currentUser.sector as Sector) || 'N1',
        assigneeName: currentUser.name,
        priority: newTaskPriority,
        status: 'A_FAZER',
        deadline: newTaskDeadline || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        tag: currentUser.sector || 'Operação',
        commentsCount: 0,
        subtasks: []
      });

      setTasks(prev => [created, ...prev]);
      setNewTaskModal(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDeadline('');
      setFeedback('✓ Nova tarefa gravada com sucesso no PostgreSQL!');
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      setFeedback('Erro ao salvar no PostgreSQL. Verifique conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
    setEditDeadline(task.deadline || '');
    setEditTag(task.tag || '');
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await taskService.updateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        deadline: editDeadline,
        tag: editTag.trim() || editingTask.sector
      });

      if (updated) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t));
      }

      setEditingTask(null);
      setFeedback(`✓ Tarefa "${editTitle}" atualizada com sucesso no PostgreSQL!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao editar tarefa no PostgreSQL:', err);
      setFeedback('Erro ao atualizar tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Delete Task (Opens Confirmation Modal)
  const handleDeleteTask = (taskId: string, title: string) => {
    setTaskToDelete({ id: taskId, title });
  };

  // Confirm and Execute Deletion in PostgreSQL
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const { id, title } = taskToDelete;
    setIsDeleting(true);

    // Optimistic UI update
    setTasks(prev => prev.filter(t => t.id !== id));
    if (editingTask?.id === id) {
      setEditingTask(null);
    }

    try {
      const ok = await taskService.deleteTask(id);
      if (ok) {
        setFeedback(`✓ Tarefa "${title}" excluída permanentemente do PostgreSQL.`);
      } else {
        setFeedback('Falha ao excluir tarefa no banco de dados.');
      }
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
      setFeedback('Erro ao excluir tarefa do banco.');
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Leader Validates Task: moves automatically to "Concluído"
  const handleConfirmValidation = async () => {
    if (!validatingTask) return;

    setIsSubmitting(true);
    try {
      const leaderName = currentUser.name || 'Líder do Setor';
      const updated = await taskService.validateTaskByLeader(
        validatingTask.id,
        leaderName,
        validationNotes.trim() || `Validado e homologado por ${leaderName}`
      );

      if (updated) {
        setTasks(prev => prev.map(t => t.id === validatingTask.id ? updated : t));
      }

      setFeedback(`✓ Tarefa "${validatingTask.title}" validada pelo Líder e movida automaticamente para Concluído!`);
      setTimeout(() => setFeedback(null), 5000);
      setValidatingTask(null);
      setValidationNotes('');
    } catch (err) {
      console.error('Erro ao validar tarefa:', err);
      setFeedback('Erro ao validar tarefa no PostgreSQL.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="main-mykanban-container">
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
                  Meu Kanban Individual
                </h1>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {currentUser.name} • {currentUser.sector}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>PostgreSQL</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Quadro individual de atividades de <strong>{currentUser.name}</strong>. Exclusivo para as suas tarefas pessoais, com edição, exclusão e validação do líder.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Atalho para o Kanban da Equipe caso seja de maior cargo */}
          {isLeaderOrAdmin && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('kanban_equipe')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#37558d] font-bold text-xs transition-all cursor-pointer"
              title="Acesso de Liderança: Ir para o Kanban da Equipe"
            >
              <Users className="w-4 h-4 text-[#37558d]" />
              <span>Kanban da Equipe →</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setNewTaskModal(true)}
            id="btn-nova-tarefa-meu-kanban"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Regra de Negócio: Informativo do Fluxo de Validação em Div Branca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#37558d] shrink-0" />
          <span className="font-semibold text-slate-700">
            Regra de Validação do Líder:
          </span>
          <span className="text-slate-600">
            Ao arrastar ou mover um card para <strong>Em Revisão</strong>, o chamado fica pendente da validação do Líder. Assim que for validado, será <strong>movido automaticamente para Concluído</strong>.
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-[#37558d] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 whitespace-nowrap self-start sm:self-auto">
          {tasks.length} Tarefas no Banco
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 5 Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks.filter(t => t.status === col.id);
          const isReviewColumn = col.id === 'EM_REVISAO';

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.id)}
              className={`rounded-3xl p-4 flex flex-col min-h-[580px] shadow-sm transition-all border ${
                isReviewColumn
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  {isReviewColumn && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {col.label}
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.countBadge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="flex-1 space-y-3">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-center p-3">
                    <span className="text-[11px] text-slate-400 font-semibold">Nenhuma tarefa aqui</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Arraste um card</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isPendingReview = task.status === 'EM_REVISAO';
                    const isApprovedDone = task.status === 'CONCLUIDO';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                        id={`task-card-${task.id}`}
                        className={`p-4 rounded-2xl bg-white border transition-all shadow-xs group cursor-grab active:cursor-grabbing relative flex flex-col justify-between gap-2.5 ${
                          isPendingReview
                            ? 'border-amber-300 hover:border-amber-400 hover:shadow-md ring-2 ring-amber-400/20'
                            : 'border-slate-200 hover:border-[#37558d]/50 hover:shadow-md'
                        }`}
                      >
                        {/* Linha Superior: Prioridade, Setor e Ações (Editar / Excluir) */}
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${
                            task.priority === 'Crítica'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'Alta'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : task.priority === 'Média'
                                  ? 'bg-blue-50 text-[#37558d] border-blue-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {task.priority}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Botão Editar Tarefa */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(task);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#37558d] hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Editar tarefa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Botão Excluir Tarefa */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id, task.title);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir tarefa do PostgreSQL"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Título da Tarefa */}
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

                        {/* Selo: Aguardando Validação do Líder */}
                        {isPendingReview && (
                          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>Aguardando Validação do Líder</span>
                            </div>
                            <p className="text-[10px] text-amber-700 leading-tight">
                              Ao ser validado pelo líder, será enviado automaticamente para "Concluído".
                            </p>

                            {/* Ação de Validação: Somente Líderes / Gestores podem homologar */}
                            {isLeaderOrAdmin ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setValidatingTask(task);
                                }}
                                className="w-full mt-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                                title="Validar entrega e mover automaticamente para Concluído"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Validar e Concluir</span>
                              </button>
                            ) : (
                              <div className="text-[10px] text-amber-800 bg-amber-100/70 py-1 px-2 rounded-lg border border-amber-300 font-semibold flex items-center gap-1.5 mt-1">
                                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Aguardando homologação do Líder</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Selo de Homologação em Tarefas Concluídas */}
                        {isApprovedDone && task.reviewedBy && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">Validado por {task.reviewedBy}</span>
                          </div>
                        )}

                        {/* Rodapé do Card: Prazo e Atribuído */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {task.deadline || 'Sem prazo'}
                          </span>
                          <span className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-semibold truncate max-w-[90px]">
                            {task.assigneeName}
                          </span>
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

      {/* MODAL: NOVA TAREFA */}
      {newTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KanbanIcon className="w-5 h-5 text-[#37558d]" />
                <h3 className="text-base font-black text-slate-900">
                  Criar Nova Tarefa no PostgreSQL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNewTaskModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ex: Revisar documentação da API ou backup semanal"
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
                  placeholder="Descreva o escopo e os critérios de entrega da atividade..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR TAREFA */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#37558d]" />
                <h3 className="text-base font-black text-slate-900">
                  Editar Tarefa (PostgreSQL)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição detalhada
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Priority)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#37558d]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Limite (Prazo)
                  </label>
                  <input
                    type="date"
                    value={editDeadline}
                    onChange={(e) => setEditDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#37558d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etiqueta / Tag
                </label>
                <input
                  type="text"
                  value={editTag}
                  onChange={(e) => setEditTag(e.target.value)}
                  placeholder="Ex: Infra, Front-End, Prioritário"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#37558d]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id, editingTask.title)}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Atualizando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VALIDAÇÃO DO LÍDER */}
      {validatingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Validação do Líder de Setor
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Aprovação formal e conclusão automática da tarefa
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5 text-xs">
              <div className="font-bold text-slate-800">{validatingTask.title}</div>
              <div className="text-slate-500 text-[11px]">
                Atribuído a: <strong>{validatingTask.assigneeName}</strong> • Setor: {validatingTask.sector}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parecer do Líder (Opcional)
              </label>
              <textarea
                rows={3}
                value={validationNotes}
                onChange={(e) => setValidationNotes(e.target.value)}
                placeholder="Ex: Entrega conferida e homologada conforme requisitos técnicos..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ao confirmar, a tarefa será <strong>automaticamente transferida para a coluna Concluído</strong> com o carimbo do validador gravado no PostgreSQL.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setValidatingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Validando...' : 'Aprovar e Concluir'}</span>
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
                  Excluir Tarefa do Banco de Dados?
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
              Tem certeza que deseja excluir esta tarefa permanentemente do banco de dados relacional? Ela deixará de constar no seu Kanban e nas métricas do sistema.
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
                id="btn-confirmar-exclusao-tarefa"
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
