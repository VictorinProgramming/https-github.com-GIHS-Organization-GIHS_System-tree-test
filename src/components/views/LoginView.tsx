import React, { useState, useRef } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Upload } from 'lucide-react';
import { Collaborator } from '../../types';
import { dbService } from '../../services/dbService';
import { GIHSLogo } from '../GIHSLogo';


interface LoginViewProps {
  onLogin: (user: Collaborator | null) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inicialização com campos completamente vazios (sem preenchimento prévio de e-mail ou senha)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha de acesso.');
      return;
    }

    setLoading(true);

    try {
      const authResult = await dbService.authenticateUser(email.trim(), password.trim());

      if (authResult) {
        setSuccessMessage(`Bem-vindo, ${authResult.name}! Acessando GIHS System...`);
        setTimeout(() => {
          onLogin(authResult as unknown as Collaborator);
        }, 600);
      } else {
        setLoading(false);
        setErrorMessage('Credenciais inválidas. Verifique seu e-mail e senha corporativos.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      setErrorMessage('Erro de conexão ao autenticar com o banco de dados. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#01122D] flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-x-hidden select-none text-slate-100">
      {/* Background soft ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#0067FC]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-[#00A6FC]/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar Centralizada com Logo Oficial GIHS */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center z-10 mb-5 mt-6 relative group">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (evt) => {
              const dataUrl = evt.target?.result as string;
            };
            reader.readAsDataURL(file);
          }}
        />
        <GIHSLogo variant="system" mode="transparent" height={64} showTagline={true} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 px-3 py-1 rounded-lg bg-[#0067FC]/70 hover:bg-[#0067FC] text-white text-[11px] font-bold flex items-center gap-1.5 shadow cursor-pointer"
          title="Upload rápido do logotipo GIHS__systems_transparent.png"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Trocar logotipo (PNG/SVG)</span>
        </button>
      </div>

      {/* Main Container: Centered Clean Login Form */}
      <div className="w-full max-w-md mx-auto my-auto py-4 z-10">
        <div className="bg-[#041838]/90 border border-[#0A2854] rounded-3xl p-7 sm:p-8 shadow-2xl backdrop-blur-xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0067FC]/15 border border-[#0067FC]/40 text-[#00A6FC] mb-3 shadow-lg shadow-[#0067FC]/20">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Acesso ao Sistema</h2>
            <p className="text-xs text-[#00A6FC] font-bold mt-0.5">GIHS SYSTEMS • Enterprise System . 100% Monitorado</p>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Informe suas credenciais para autenticar na plataforma
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <p className="leading-relaxed font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <p className="leading-relaxed font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A6FC] focus:ring-1 focus:ring-[#00A6FC] transition-all"
                  placeholder="seu.email@bycomp.com.br"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A6FC] focus:ring-1 focus:ring-[#00A6FC] transition-all font-mono"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0067FC] via-[#007BFC] to-[#00A6FC] hover:from-[#0052CA] hover:to-[#008BEB] text-white text-xs font-black tracking-wide uppercase transition-all shadow-lg shadow-[#0067FC]/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no GIHS System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center z-10 py-3 text-xs text-slate-400">
        <p>
          <span className="text-[#00A6FC] font-bold">© 2026 GIHS System</span> • Todos os direitos reservados
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          Sistemas Corporativos de Gestão e Monitoramento 100% Integrado
        </p>
      </div>
    </div>
  );
};
