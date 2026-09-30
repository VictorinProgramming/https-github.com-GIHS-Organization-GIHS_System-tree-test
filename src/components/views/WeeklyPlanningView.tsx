import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckSquare,
  Plus,
  Trash2,
  Edit,
  User,
  Building2,
  CalendarDays,
  Kanban as KanbanIcon,
  Filter,
  Check,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Task, TaskStatus, Priority, Collaborator, ViewScreen } from '../../types';
import { taskService } from '../../services/taskService';
import { CURRENT_USER } from '../../data/mockData';

interface WeeklyPlanningViewProps {
  currentUser?: Collaborator;
  onNavigate?: (screen: ViewScreen) => void;
}

interface WeekDayItem {
  day: string;
  full: string;
  date: string;       // DD/MM/YYYY
  isoDate: string;    // YYYY-MM-DD
  shortDate: string;  // DD/MM
  isToday: boolean;
  dayOfWeekNum: number; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
}

// Retorna a lista dos 5 dias úteis (Segunda a Sexta) ou 7 dias conforme a semana solicitada (offset em semanas)
function generateCurrentWeekDays(weekOffset = 0): {
  days: WeekDayItem[];
  weekRangeLabel: string;
  isCurrentWeek: boolean;
  todayIndex: number;
} {
  const now = new Date();
  // Se quisermos navegar semanas para frente/trás:
  now.setDate(now.getDate() + weekOffset * 7);

  const realToday = new Date();
  const realTodayIso = realToday.toISOString().slice(0, 10);

  // Determinar o dia da semana atual: 0=Domingo, 1=Segunda, ..., 6=Sábado
  const currentDayOfWeek = now.getDay();
  // Distância até a Segunda-feira: se for Domingo (0), a segunda foi há 6 dias ou a próxima é amanhã (+1).
  // No padrão corporativo, Domingo fecha a semana anterior ou inicia a nova.
  // Vamos calcular Segunda como base:
  const distToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);

  const dayNames = [
    { day: 'SEG', full: 'Segunda-feira' },
    { day: 'TER', full: 'Terça-feira' },
    { day: 'QUA', full: 'Quarta-feira' },
    { day: 'QUI', full: 'Quinta-feira' },
    { day: 'SEX', full: 'Sexta-feira' }
  ];

  let todayIdx = -1;

  const days: WeekDayItem[] = dayNames.map((d, index) => {
    const itemDate = new Date(monday);
    itemDate.setDate(monday.getDate() + index);

    const year = itemDate.getFullYear();
    const month = String(itemDate.getMonth() + 1).padStart(2, '0');
    const day = String(itemDate.getDate()).padStart(2, '0');

    const isoDate = `${year}-${month}-${day}`;
    const dateFormatted = `${day}/${month}/${year}`;
    const shortDate = `${day}/${month}`;
    const isToday = isoDate === realTodayIso;

    if (isToday) {
      todayIdx = index;
    }

    return {
      day: d.day,
      full: d.full,
      date: dateFormatted,
      isoDate,
      shortDate,
      isToday,
      dayOfWeekNum: itemDate.getDay()
    };
  });

  const firstDay = days[0].date;
  const lastDay = days[days.length - 1].date;
  const weekRangeLabel = `${firstDay} a ${lastDay}`;
  const isCurrentWeek = weekOffset === 0;

  return { days, weekRangeLabel, isCurrentWeek, todayIndex: todayIdx };
}

export const WeeklyPlanningView: React.FC<WeeklyPlanningViewProps> = ({
  currentUser = CURRENT_USER,
  onNavigate
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Calcula a semana atual dinamicamente em tempo real
  const {
    days: weekDays,
    weekRangeLabel,
    isCurrentWeek,
    todayIndex
  } = useMemo(() => generateCurrentWeekDays(weekOffset), [weekOffset]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    return todayIndex >= 0 ? todayIndex : 0;
  });

  // Atualizar índice selecionado quando mudar a semana
  useEffect(() => {
    if (todayIndex >= 0) {
      setSelectedDayIndex(todayIndex);
    } else {
      setSelectedDayIndex(0);
    }
  }, [todayIndex, weekOffset]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('MEDIA');
  const [newTaskTime, setNewTaskTime] = useState('09:00');
  const [newTaskDuration, setNewTaskDuration] = useState('1h 30m');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de exclusão
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal de edição rápida
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIA');

  // Nome do dia de hoje formatado
  const todayLabel = useMemo(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return today.toLocaleDateString('pt-BR', options);
  }, []);

  // Inscrição em tempo real no banco PostgreSQL - ESTRITAMENTE INDIVIDUAL
  useEffect(() => {
    const unsub = taskService.subscribeTasks((allTasks) => {
      // Regra de Negócio: Planejamento Semanal Individual (cada um vê o seu)
      const myIndividualTasks = allTasks.filter((t) => {
        if (t.assigneeId && currentUser.id && String(t.assigneeId) === String(currentUser.id)) {
          return true;
        }
        if (!t.assigneeName || !currentUser.name) return false;

        const tName = t.assigneeName.toLowerCase().trim();
        const uName = currentUser.name.toLowerCase().trim();
        if (tName === uName) return true;

        const normT = tName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
        const normU = uName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
        if (normT === normU) return true;

        const partsT = normT.split(' ');
        const partsU = normU.split(' ');
        if (partsT.length >= 2 && partsU.length >= 2) {
          if (partsT[0] === partsU[0] && partsT[partsT.length - 1] === partsU[partsU.length - 1]) return true;
        }
        return false;
      });

      setTasks(myIndividualTasks);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  // Indicadores de desempenho individual na semana
  const totalPlanned = tasks.length;
  const totalCompleted = tasks.filter(t => t.status === 'CONCLUIDO').length;
  const totalInProgress = tasks.filter(t => t.status === 'EM_ANDAMENTO').length;
  const totalPending = tasks.filter(t => t.status === 'A_FAZER' || t.status === 'BACKLOG').length;
  const completionPercent = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  const indicators = [
    {
      title: 'Minhas Atividades Planejadas',
      value: totalPlanned.toString(),
      subtext: 'Demandas pessoais alocadas',
      icon: Target,
      color: 'text-[#37558d] bg-blue-50 border-blue-200'
    },
    {
      title: 'Atividades Concluídas',
      value: totalCompleted.toString(),
      subtext: `${completionPercent}% da sua meta semanal`,
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Em Andamento',
      value: totalInProgress.toString(),
      subtext: 'Execução ativa hoje',
      icon: Clock,
      color: 'text-amber-700 bg-amber-50 border-amber-200'
    },
    {
      title: 'Pendentes / A Fazer',
      value: totalPending.toString(),
      subtext: 'Próximas entregas na fila',
      icon: AlertTriangle,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200'
    }
  ];

  // Distribuir tarefas do usuário pelos dias da semana baseado na data real (DD/MM/YYYY ou YYYY-MM-DD)
  const getTasksForDay = (dayPlan: WeekDayItem, dayIdx: number) => {
    // 1. Prioriza correspondência exata de data no deadline
    const directMatches = tasks.filter(t => {
      if (!t.deadline) return false;
      const d = t.deadline.trim();
      if (d === dayPlan.date || d === dayPlan.isoDate) return true;
      if (d.includes(dayPlan.shortDate)) return true;

      // Se for formato ISO tipo 2026-09-27
      if (d.startsWith(dayPlan.isoDate)) return true;

      return false;
    });

    if (directMatches.length > 0) return directMatches;

    // 2. Se a tarefa não tem data fixa atribuída aos dias visíveis, distribui proporcionalmente
    const weekIsoDates = new Set(weekDays.map(w => w.isoDate));
    const weekFormattedDates = new Set(weekDays.map(w => w.date));

    const unassignedToWeek = tasks.filter(t => {
      if (!t.deadline) return true;
      return !weekIsoDates.has(t.deadline) && !weekFormattedDates.has(t.deadline);
    });

    return unassignedToWeek.filter((_, idx) => idx % 5 === dayIdx);
  };

  // Criar nova atividade semanal
  const handleCreatePlannedTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    const day = weekDays[selectedDayIndex] || weekDays[0];

    try {
      const created = await taskService.createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || `Atividade semanal de ${currentUser.name} para ${day.full} (${day.date})`,
        sector: currentUser.sector || 'Operação',
        assigneeName: currentUser.name,
        assigneeId: currentUser.id,
        priority: newTaskPriority,
        status: 'A_FAZER',
        deadline: day.date,
        tag: 'Planejamento',
        commentsCount: 0,
        subtasks: []
      });

      setTasks(prev => [created, ...prev]);
      setIsModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setFeedback(`✓ Atividade agendada para ${day.full} (${day.date}) com sucesso!`);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao planejar tarefa:', err);
      setFeedback('Erro ao salvar atividade. Tente novamente.');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar status da atividade (Concluído <-> A Fazer)
  const handleToggleDone = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'CONCLUIDO' ? 'A_FAZER' : 'CONCLUIDO';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      await taskService.updateTaskStatus(task.id, nextStatus);
    } catch (err) {
      console.error('Erro ao atualizar status da tarefa:', err);
    }
  };

  // Confirmar exclusão de tarefa
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setFeedback(`✓ Atividade "${taskToDelete.title}" excluída do seu planejamento.`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erro ao excluir atividade:', err);
    } finally {
      setIsDeleting(false);
      setTaskToDelete(null);
    }
  };

  // Salvar edição rápida
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    try {
      await taskService.updateTask(editingTask.id, {
        title: editTitle.trim(),
        priority: editPriority
      });
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, title: editTitle.trim(), priority: editPriority } : t));
      setEditingTask(null);
      setFeedback('✓ Atividade atualizada com sucesso!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="weekly-planning-main">
      {/* HEADER CORPORATIVO (Div Branca) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-2xs">
            <Calendar className="w-6 h-6 text-[#37558d]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Meu Planejamento Semanal
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200">
                {currentUser.name} • {currentUser.sector}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Individual</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Hoje é <strong className="text-slate-800 capitalize">{todayLabel}</strong>. Exibindo semana de <strong>{weekRangeLabel}</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Navegador de Semanas */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev - 1)}
              title="Semana anterior"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                weekOffset === 0
                  ? 'bg-[#37558d] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-white'
              }`}
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(prev => prev + 1)}
              title="Próxima semana"
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('meu_kanban')}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#37558d] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KanbanIcon className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Ver no Meu Kanban</span>
            </button>
          )}

          <button
            type="button"
            id="btn-planejar-nova-atividade"
            onClick={() => {
              // Se hoje estiver na semana visível, seleciona hoje por padrão
              if (todayIndex >= 0) {
                setSelectedDayIndex(todayIndex);
              } else {
                setSelectedDayIndex(0);
              }
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-md shadow-[#37558d]/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ Planejar Atividade</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOAST (Div Branca) */}
      {feedback && (
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 4 INDICADORES INDIVIDUAIS (Divs Brancas) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {indicators.map((ind, idx) => {
          const Icon = ind.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {ind.title}
                </span>
                <p className="text-2xl font-black text-slate-800 font-mono mt-1">
                  {ind.value}
                </p>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                  {ind.subtext}
                </span>
              </div>
              <div className={`p-3 rounded-2xl border ${ind.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* BARRA DE PROGRESSO DA SEMANA (Div Branca) */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <TrendingUp className="w-4 h-4 text-[#37558d]" />
            <span>Progresso da Semana ({weekRangeLabel})</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#37558d]">
            <span>{totalCompleted} de {totalPlanned} concluídas</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700">{completionPercent}% de aproveitamento</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#37558d] h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* GRADE DOS 5 DIAS DA SEMANA (Divs Brancas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {weekDays.map((dayPlan, dayIdx) => {
          const dayTasks = getTasksForDay(dayPlan, dayIdx);
          const dayCompleted = dayTasks.filter(t => t.status === 'CONCLUIDO').length;

          return (
            <div
              key={dayPlan.day}
              className={`bg-white rounded-3xl border p-4 flex flex-col min-h-[460px] shadow-sm transition-all ${
                dayPlan.isToday
                  ? 'border-2 border-[#37558d] ring-4 ring-blue-50/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Cabeçalho do Dia (Div Branca) */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${
                    dayPlan.isToday
                      ? 'bg-[#37558d] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {dayPlan.day}
                  </div>
                  <div>
                    <h3 className="font-black text-xs text-slate-900 leading-tight">
                      {dayPlan.full}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">
                      {dayPlan.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {dayPlan.isToday && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#37558d] border border-blue-200">
                      Hoje
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDayIndex(dayIdx);
                      setIsModalOpen(true);
                    }}
                    title={`Adicionar atividade em ${dayPlan.full}`}
                    className="w-6 h-6 rounded-lg bg-slate-50 hover:bg-[#37558d] hover:text-white border border-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Lista de Atividades do Dia (Cards em Div Branca) */}
              <div className="space-y-2.5 flex-1">
                {dayTasks.map((task) => {
                  const isDone = task.status === 'CONCLUIDO';
                  const isReview = task.status === 'EM_REVISAO';

                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2 group ${
                        isDone
                          ? 'bg-slate-50/60 border-slate-200 opacity-80'
                          : isReview
                            ? 'bg-amber-50/30 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Linha de Horário e Prioridade */}
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#37558d] font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {task.deadline || dayPlan.shortDate}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${
                          task.priority === 'CRITICA' || task.priority === 'ALTA'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : task.priority === 'MEDIA'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {task.priority || 'Média'}
                        </span>
                      </div>

                      {/* Título da Atividade e Checkbox */}
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDone(task)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                          title={isDone ? 'Reabrir atividade' : 'Concluir atividade'}
                        >
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              isDone ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300'
                            }`}
                          />
                        </button>
                        <h4
                          className={`text-xs font-bold leading-snug flex-1 ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Descrição resumida se houver */}
                      {task.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Status e Ações Rápidas */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className="font-semibold text-slate-500">
                          {task.status === 'CONCLUIDO'
                            ? '✓ Concluído'
                            : task.status === 'EM_REVISAO'
                              ? '⏱ Em Revisão'
                              : task.status === 'EM_ANDAMENTO'
                                ? '⚡ Em Andamento'
                                : '📌 A Fazer'}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setEditTitle(task.title);
                              setEditPriority(task.priority || 'MEDIA');
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-[#37558d] hover:bg-slate-100 cursor-pointer"
                            title="Editar atividade"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskToDelete(task)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Excluir atividade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {dayTasks.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-3">
                    <CalendarDays className="w-6 h-6 mb-1 text-slate-300" />
                    <span>Nenhuma atividade agendada</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayIndex(dayIdx);
                        setIsModalOpen(true);
                      }}
                      className="mt-2 text-[11px] text-[#37558d] font-bold hover:underline cursor-pointer"
                    >
                      + Agendar para este dia
                    </button>
                  </div>
                )}
              </div>

              {/* Rodapé do Dia (Div Branca) */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>{dayTasks.length} {dayTasks.length === 1 ? 'atividade' : 'atividades'}</span>
                <span className="text-emerald-700 font-bold">
                  {dayCompleted} concluída{dayCompleted !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: PLANEJAR NOVA ATIVIDADE (Div Branca) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#37558d]">
                  <Calendar className="w-5 h-5 text-[#37558d]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Planejar Minha Atividade
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Atribuída exclusivamente a {currentUser.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlannedTask} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia da Semana *
                  </label>
                  <select
                    value={selectedDayIndex}
                    onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white cursor-pointer"
                  >
                    {weekDays.map((w, idx) => (
                      <option key={w.day} value={idx}>
                        {w.full} ({w.date}) {w.isToday ? '— Hoje' : ''}
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white cursor-pointer"
                  >
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Atividade Planejada *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auditoria preventiva de logs e otimização de consultas SQL"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição / Detalhamento Técnico
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhes da entrega, requisitos ou observações para o dia..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:bg-white font-medium resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#37558d] shrink-0" />
                <span>
                  Responsável: <strong>{currentUser.name}</strong> • Setor: <strong>{currentUser.sector}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-md shadow-[#37558d]/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Salvando...' : 'Gravar no Planejamento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIÇÃO RÁPIDA (Div Branca) */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#37558d]" />
                <span>Editar Atividade</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Atividade *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-[#37558d] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prioridade
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white cursor-pointer"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-md shadow-[#37558d]/20 transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO (Div Branca) */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Excluir Atividade do Planejamento?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Ação definitiva no PostgreSQL
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Atividade selecionada:</span>
              <p className="font-semibold text-slate-900 text-sm">
                "{taskToDelete.title}"
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja remover esta atividade do seu cronograma semanal? Ela deixará de constar no seu planejamento e no seu Kanban individual.
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
                id="btn-confirmar-exclusao-planejamento"
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
