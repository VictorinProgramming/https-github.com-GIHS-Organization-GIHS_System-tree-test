import React from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  LayoutDashboard,
  Crown,
  UserCog,
  Shield
} from 'lucide-react';
import { Collaborator, ViewScreen } from '../../../types';
import { AUTH_ACCOUNTS, convertCredentialToCollaborator } from '../../../data/authCredentials';

interface PrivateAccessLockProps {
  currentUser?: Collaborator;
  onSwitchUser?: (user: Collaborator) => void;
  onNavigate?: (screen: ViewScreen) => void;
  phaseNumber?: 2 | 3 | 4;
  phaseBadge?: string;
  title?: string;
  description?: React.ReactNode;
  userRestrictionNote?: string;
  whyPrivateTitle?: string;
  whyPrivateDescription?: string;
}

export const PrivateAccessLock: React.FC<PrivateAccessLockProps> = ({
  currentUser,
  onSwitchUser,
  onNavigate,
  phaseNumber = 4,
  phaseBadge,
  title,
  description,
  userRestrictionNote,
  whyPrivateTitle,
  whyPrivateDescription
}) => {
  const helenaAccount = AUTH_ACCOUNTS.find(a => a.role === 'ADMINISTRATIVO');
  const victorAccount = AUTH_ACCOUNTS.find(a => a.role === 'SUPER_ADMIN');
  const carlosAccount = AUTH_ACCOUNTS.find(a => a.role === 'GESTOR');

  const handleSimulateUser = (acc: typeof AUTH_ACCOUNTS[0]) => {
    if (onSwitchUser) {
      onSwitchUser(convertCredentialToCollaborator(acc));
    }
  };

  // Phase-specific defaults
  const effectiveBadge =
    phaseBadge ||
    (phaseNumber === 2
      ? 'FASE 2 • TELA PRIVADA & CONFIDENCIAL'
      : phaseNumber === 3
      ? 'FASE 3 • TELA PRIVADA & CONFIDENCIAL'
      : 'FASE 4 • TELA PRIVADA & CONFIDENCIAL');

  const effectiveTitle = title || 'Acesso Restrito: Gestão, Administração & RH';

  const effectiveDescription =
    description ||
    (phaseNumber === 2 ? (
      <>
        O módulo de <strong className="text-slate-200">UX/UI Design System & Wireframes da Fase 2</strong> é um ambiente restrito e protegido por governança corporativa e sigilo de produto do GIHS System. Acesso reservado à liderança estratégica.
      </>
    ) : phaseNumber === 3 ? (
      <>
        O módulo de <strong className="text-slate-200">Organograma Institucional da Fase 3</strong> é um ambiente restrito e protegido por governança corporativa e conformidade com a <strong className="text-rose-300">LGPD (Art. 46)</strong>. Acesso reservado à linha de comando e gestão de pessoas.
      </>
    ) : (
      <>
        O módulo de <strong className="text-slate-200">Colaboradores da Fase 4</strong> é um ambiente restrito e protegido por governança corporativa e conformidade com a <strong className="text-rose-300">LGPD (Lei Geral de Proteção de Dados - Art. 46)</strong>.
      </>
    ));

  const effectiveUserRestriction =
    userRestrictionNote ||
    (phaseNumber === 2
      ? '⛔ Perfil sem permissão para especificações de arquitetura e protótipos'
      : phaseNumber === 3
      ? '⛔ Perfil sem permissão para visualização de linhas de comando e subordinação'
      : '⛔ Perfil sem permissão para prontuários funcionais e dados contratuais');

  const effectiveWhyTitle =
    whyPrivateTitle ||
    (phaseNumber === 2
      ? 'Por que a Fase 2 é privada?'
      : phaseNumber === 3
      ? 'Por que a Fase 3 é privada?'
      : 'Por que esta tela é privada?');

  const effectiveWhyDescription =
    whyPrivateDescription ||
    (phaseNumber === 2
      ? 'Reúne a documentação de alta fidelidade das 22 telas navegáveis, wireframes intersetoriais responsivos, fluxos de engenharia e a matriz de governança técnica. O acesso é restrito à liderança de Gestão, Administração e RH.'
      : phaseNumber === 3
      ? 'Reúne a árvore hierárquica completa dos 11 setores, linhas de subordinação de 48 colaboradores, metas de SLA setorial e o simulador interativo de reestruturação de cargos. Acesso confidencial para Gestão, Administração e RH.'
      : 'Reúne dados sensíveis do departamento de pessoal: faixas salariais, contratos (CLT/PJ), atestados médicos ocupacionais (ASO) e matriz de permissões. Apenas gestores autorizados possuem credencial de acesso.');

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Header with Lock Icon */}
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold tracking-wide">
              <span>{effectiveBadge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#37558d] tracking-tight">
              {effectiveTitle}
            </h1>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              {effectiveDescription}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 relative z-10">
          {/* Current User Card */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={currentUser?.name || 'Usuário'}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#37558d] truncate">
                  {currentUser?.name || 'Colaborador Autenticado'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                  {currentUser?.userRole || 'COLABORADOR'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{currentUser?.role || 'Analista'}</p>
              <p className="text-[10px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                <span>{effectiveUserRestriction}</span>
              </p>
            </div>
          </div>

          {/* Privacy Notice Card */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-center text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>{effectiveWhyTitle}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {effectiveWhyDescription}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Acesso reservado exclusivamente à linha de comando e administração.</span>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4 text-white" />
              <span>Voltar ao Início</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
