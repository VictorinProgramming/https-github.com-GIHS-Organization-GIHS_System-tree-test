import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Shield,
  Stethoscope,
  DollarSign,
  HeartPulse,
  BadgeCheck,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Building2,
  Layers,
  Eye,
  EyeOff,
  Edit3,
  Trash2
} from 'lucide-react';
import { Collaborator } from '../../../types';

interface CollaboratorDetailDrawerProps {
  collaborator: Collaborator | null;
  onClose: () => void;
  onToggleBlock?: (c: Collaborator) => void;
  onEdit?: (c: Collaborator) => void;
  onDelete?: (c: Collaborator) => void;
  isSuperAdmin?: boolean;
  showToast: (msg: string) => void;
}

export const CollaboratorDetailDrawer: React.FC<CollaboratorDetailDrawerProps> = ({
  collaborator,
  onClose,
  onToggleBlock,
  onEdit,
  onDelete,
  isSuperAdmin = true,
  showToast
}) => {
  const [showSalaryDetail, setShowSalaryDetail] = useState(false);

  if (!collaborator) return null;

  const c = collaborator;
  const isBlocked = c.isBlocked;
  const isExpiring = c.asoStatus === 'A renovar';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
      <div 
        id="drawer-dossie-colaborador"
        className="bg-white border-l border-slate-200 w-full max-w-xl h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-[#37558d] uppercase tracking-wider">
              Dossiê Funcional • Visualizar Funcionário
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Identity Card */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <img
                src={c.avatar}
                alt={c.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-200 shadow-xs"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  isBlocked
                    ? 'bg-rose-500'
                    : c.status === 'Em atividade'
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              ></span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[#37558d] truncate">{c.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    c.userRole === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : c.userRole === 'ADMINISTRATIVO'
                      ? 'bg-blue-50 text-[#37558d] border-blue-200'
                      : c.userRole === 'GESTOR'
                      ? 'bg-[#37558d] text-white'
                      : 'bg-slate-100 text-[#37558d] border border-slate-200'
                  }`}
                >
                  {c.userRole || 'COLABORADOR'}
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-0.5 font-medium">{c.role || 'Colaborador'}</p>

              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-mono flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                  Setor: {c.sector || 'Geral'}
                </span>
                <span>• Área: {c.area || 'TI'}</span>
                {(c.serviceClassification || (c as any).service_classification) && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                    Fila Técnica: {c.serviceClassification || (c as any).service_classification}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1 bg-white">
          {/* Block alert if user is blocked */}
          {isBlocked && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div>
                <p className="font-bold">Acesso ao sistema suspenso</p>
                <p className="text-[11px] text-rose-600">
                  O colaborador está temporariamente impedido de efetuar login ou registrar apontamentos.
                </p>
              </div>
            </div>
          )}

          {/* Section 1: Dados Contratuais & RH (Privado) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#37558d]" />
              Contrato de Trabalho & Departamento Pessoal
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Regime de Contratação</span>
                <span className="font-bold text-[#37558d] mt-0.5 block">{c.contractType || 'CLT'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Data de Admissão</span>
                <span className="font-bold text-[#37558d] mt-0.5 block font-mono">{c.admissionDate || '14/03/2024'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">Carga Horária</span>
                <span className="font-bold text-[#37558d] mt-0.5 block">{c.workSchedule || '40h semanais (08h às 17h)'}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[11px] block">CPF Protegido (LGPD)</span>
                <span className="font-bold text-[#37558d] mt-0.5 block font-mono">{c.cpfMasked || '***.418.902-**'}</span>
              </div>
            </div>

            {/* Salary Bracket Box with toggle */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  Faixa Salarial / Remuneração Base
                </span>
                <div className="mt-1 font-mono font-bold text-[#37558d] text-sm">
                  {showSalaryDetail ? (
                    <span className="text-amber-800">{c.salaryBracket || 'R$ 5.800,00'}</span>
                  ) : (
                    <span className="text-slate-400 tracking-widest">•••••••••••••</span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowSalaryDetail(!showSalaryDetail)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                {showSalaryDetail ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#37558d]" />
                    <span>Revelar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Saúde Ocupacional & ASO */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              Saúde Ocupacional (Atestado de Saúde Ocupacional - ASO)
            </h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    isExpiring
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isExpiring ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <BadgeCheck className="w-5 h-5 text-emerald-600" />}
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {isExpiring ? 'Exame ASO a Renovar' : 'Exame ASO em Dia'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isExpiring
                      ? 'Vencimento em menos de 30 dias. Notificação emitida para agendamento clínico.'
                      : 'Atestado periódico válido conforme NR-7. Apto para atividades normais.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Benefícios Corporativos Ativos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[#37558d]" />
              Pacote de Benefícios Concedidos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(c.benefits || ['Vale Refeição R$ 45/dia', 'Vale Transporte', 'SulAmérica Saúde', 'Seguro de Vida']).map(
                (benefit, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Section 4: Contatos & Emergência */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#37558d]" />
              Canais de Contato Corporativo
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  E-mail Corporativo:
                </span>
                <span className="text-[#37558d] font-mono font-medium">{c.email}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Telefone / Ramal:
                </span>
                <span className="text-[#37558d] font-mono font-medium">{c.phone || '(11) 98877-0000'}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  Contato de Emergência:
                </span>
                <span className="text-[#37558d] font-mono font-medium">{c.emergencyContact || '(11) 98711-4000 (Família)'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(c);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#37558d] border border-blue-200 transition-colors cursor-pointer"
                title="Editar cargo e dados cadastrais"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#37558d]" />
                <span>Editar Cargo/Dados</span>
              </button>
            )}

            {onToggleBlock && c.id !== 'colab-1' && c.id !== 'user-master-victor' && (
              <button
                onClick={() => {
                  onToggleBlock(c);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isBlocked
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isBlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Desbloquear</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Bloquear</span>
                  </>
                )}
              </button>
            )}

            {onDelete && isSuperAdmin && c.id !== 'colab-1' && c.id !== 'user-master-victor' && (
              <button
                onClick={() => {
                  onDelete(c);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                title="Excluir Colaborador"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Excluir Usuário</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Fechar Dossiê
          </button>
        </div>
      </div>
    </div>
  );
};
