import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  X, 
  Crown, 
  UserCog, 
  Users, 
  Key, 
  Copy, 
  Check, 
  ArrowRight, 
  ShieldAlert,
  Search,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserRole, ViewScreen, Collaborator } from '../types';
import { 
  USER_CREDENTIALS, 
  SCREEN_SECURITY_POLICIES, 
  UserCredentialAccount, 
  convertCredentialToCollaborator,
  checkScreenAccess 
} from '../data/authCredentials';

interface RoleSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Collaborator;
  onSelectUser: (user: Collaborator) => void;
  onNavigateToScreen: (screen: ViewScreen) => void;
}

export const RoleSimulatorModal: React.FC<RoleSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
  onNavigateToScreen
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [screenSearch, setScreenSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const allScreens = Object.values(SCREEN_SECURITY_POLICIES);
  const filteredScreens = allScreens.filter(s => 
    s.screenTitle.toLowerCase().includes(screenSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(screenSearch.toLowerCase()) ||
    s.screen.toLowerCase().includes(screenSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        id="role-simulator-modal"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Central de Simulação de Permissões & Credenciais (RBAC)</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300">
                  4 Níveis Hierárquicos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Usuários e senhas criados para testes executivos de controle de acesso tela a tela.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Current User Status */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Usuários & Senhas ({USER_CREDENTIALS.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Matriz de Acesso das Telas ({allScreens.length})
            </button>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400">Usuário Ativo:</span>
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-5 h-5 rounded-full object-cover ring-1 ring-cyan-500"
            />
            <span className="font-semibold text-white">{currentUser.name}</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              currentUser.userRole === 'SUPER_ADMIN'
                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                : currentUser.userRole === 'ADMINISTRATIVO'
                ? 'bg-sky-950 text-sky-300 border border-sky-800'
                : currentUser.userRole === 'GESTOR'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {currentUser.userRole}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'users' ? (
            <div className="space-y-4">
              <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300">
                  <p className="font-semibold text-white mb-0.5 flex items-center gap-2">
                    <span>Cyber-Security & Sigilo de Credenciais Corporativas:</span>
                    <span className="px-2 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono">
                      Criptografia PBKDF2 / Salt
                    </span>
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Todas as senhas são confidenciais e mantidas sob sigilo corporativo. Você pode alternar sessões diretamente via <strong className="text-cyan-300 font-semibold">“Assumir este Usuário”</strong>. As senhas permanecem ocultas por padrão e qualquer tentativa de acesso é rastreada na Trilha de Auditoria imutável.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {USER_CREDENTIALS.map((user) => {
                  const isActive = currentUser.email === user.email;
                  return (
                    <div
                      key={user.id}
                      className={`p-4 rounded-xl border transition-all relative ${
                        isActive
                          ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">{user.name}</h4>
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold">
                                  ATIVO
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{user.currentTask}</p>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${user.badgeStyle.bg} ${user.badgeStyle.text} ${user.badgeStyle.border}`}>
                          {user.roleLabel}
                        </span>
                      </div>

                      {/* Credentials Box */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 mb-3 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-500 text-[11px]">E-mail:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-cyan-300">{user.email}</span>
                            <button
                              onClick={() => handleCopy(user.email, `email-${user.id}`)}
                              title="Copiar e-mail"
                              className="p-1 hover:text-white text-slate-500 transition-colors"
                            >
                              {copiedId === `email-${user.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-cyan-400" />
                            <span>Senha Sigilosa:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-mono font-bold bg-slate-900/90 px-2 py-0.5 rounded-md border border-slate-700 tracking-wider text-xs">
                              {revealedPasswords[user.id] ? user.password : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.id)}
                              title={revealedPasswords[user.id] ? "Ocultar senha sigilosa" : "Revelar senha sigilosa"}
                              className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              {revealedPasswords[user.id] ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopy(user.password, `pass-${user.id}`)}
                              title="Copiar senha com segurança"
                              className="p-1 hover:text-white text-slate-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                            >
                              {copiedId === `pass-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Scope & Permissions Description */}
                      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                        {user.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-850">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Setor: <strong className="text-slate-300">{user.sector}</strong> • Telas: <strong className="text-cyan-400">{user.allowedScreensCount}</strong>
                        </span>

                        <button
                          onClick={() => {
                            onSelectUser(convertCredentialToCollaborator(user));
                            onClose();
                          }}
                          disabled={isActive}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isActive
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20'
                          }`}
                        >
                          <span>{isActive ? 'Perfil em Uso' : 'Assumir este Usuário'}</span>
                          {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filtrar tela ou categoria (ex: auditoria, ponto, kanban, clientes)..."
                    value={screenSearch}
                    onChange={(e) => setScreenSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Mostrando {filteredScreens.length} de {allScreens.length} telas
                </div>
              </div>

              {/* Screens Matrix Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="p-3">Tela / Módulo</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3 text-center">Super Admin</th>
                        <th className="p-3 text-center">Administrativo</th>
                        <th className="p-3 text-center">Gestor</th>
                        <th className="p-3 text-center">Colaborador</th>
                        <th className="p-3 text-right">Ação de Teste</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredScreens.map((item) => {
                        const currentRole = currentUser.userRole || 'COLABORADOR';
                        const currentAllowed = item.allowedRoles.includes(currentRole);

                        return (
                          <tr key={item.screen} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-slate-200">{item.screenTitle}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{item.screen}</p>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                                {item.category}
                              </span>
                            </td>

                            {/* Super Admin */}
                            <td className="p-3 text-center">
                              {item.allowedRoles.includes('SUPER_ADMIN') ? (
                                <span className="inline-flex items-center text-emerald-400 text-xs gap-1 font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-400 text-xs gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>

                            {/* Administrativo */}
                            <td className="p-3 text-center">
                              {item.allowedRoles.includes('ADMINISTRATIVO') ? (
                                <span className="inline-flex items-center text-emerald-400 text-xs gap-1 font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-400 text-xs gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>

                            {/* Gestor */}
                            <td className="p-3 text-center">
                              {item.allowedRoles.includes('GESTOR') ? (
                                <span className="inline-flex items-center text-emerald-400 text-xs gap-1 font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-400 text-xs gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>

                            {/* Colaborador */}
                            <td className="p-3 text-center">
                              {item.allowedRoles.includes('COLABORADOR') ? (
                                <span className="inline-flex items-center text-emerald-400 text-xs gap-1 font-semibold">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-400 text-xs gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  onNavigateToScreen(item.screen);
                                  onClose();
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                                  currentAllowed
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 hover:bg-cyan-900'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900'
                                }`}
                                title={currentAllowed ? 'Abrir tela (Acesso Liberado)' : 'Testar bloqueio de segurança (RBAC Gate)'}
                              >
                                {currentAllowed ? (
                                  <>
                                    <span>Abrir Tela</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Testar Bloqueio</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>As permissões são aplicadas e validadas imediatamente ao navegar entre as telas.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
