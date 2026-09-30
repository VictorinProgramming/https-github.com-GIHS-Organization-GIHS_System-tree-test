import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { AI_TOOLS_DATA } from '../../data/mockData';
import { ViewScreen } from '../../types';
import { GIHSLogo } from '../GIHSLogo';

interface AIHubViewProps {
  onNavigate: (screen: ViewScreen) => void;
}

export const AIHubView: React.FC<AIHubViewProps> = ({ onNavigate }) => {
  const [prompt, setPrompt] = useState('');
  const [executing, setExecuting] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const suggestions = [
    "Gerar relatório executivo de produtividade da semana",
    "Criar procedimento operacional padrão (SOP) para escalonamento N3",
    "Analisar gargalos no atendimento de chamados do Suporte N2",
    "Sugerir pauta de 5 vídeos técnicos para LinkedIn e TikTok"
  ];

  const handleExecute = (customPrompt?: string) => {
    const textToRun = customPrompt || prompt;
    if (!textToRun.trim()) return;

    setExecuting(true);
    setGeneratedOutput(null);

    setTimeout(() => {
      setExecuting(false);
      setGeneratedOutput(`### 🤖 RELATÓRIO DO AGENTE AUTÔNOMO — GIHS AGENTS
**Alvo:** ${textToRun}
**Data:** 16/09/2026 — 09:30 BRT | **Motor:** GIHS Agents LLM Core v4.2 (Grounded)

#### 1. Diagnóstico da Operação
* Produtividade consolidada da equipe em **93.2%**, com destaque para DBA e Suporte N3 (SLA 99.8%).
* Gargalo identificado no **Suporte N2** devido a 18 chamados concorrentes de redefinição de VPN.

#### 2. Ações Autônomas Recomendadas
1. **Automação de Autoatendimento:** Ativar fluxo guiado no Portal de Atendimento para reset de credenciais com validação MFA.
2. **Rebalanceamento de Fila:** Redirecionar 4 chamados de média complexidade para a fila do Suporte N1 sênior.
3. **Previsão de Conclusão da Sprint:** 96% de assertividade até sexta-feira às 18h.

*Status: Relatório auditado e registrado na trilha de auditoria corporativa do GIHS System.*`);
    }, 1000);
  };

  const handleCopy = () => {
    if (generatedOutput) {
      navigator.clipboard.writeText(generatedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header com Identidade Oficial GIHS Agents */}
      <div className="bg-[#041838] border border-[#0A2854] p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <GIHSLogo variant="agents" mode="transparent" height={52} showTagline={true} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#00E5FF] bg-[#0067FC]/15 border border-[#00A6FC]/30 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-ping"></span>
            <span>Cluster GIHS Agents: 99.9% Operacional</span>
          </span>
        </div>
      </div>

      {/* Quick Prompt Center (Command Console) */}
      <div className="bg-[#041838] border border-[#0A2854] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00A6FC]" />
            <span>O que você deseja que os agentes autônomos executem agora?</span>
          </label>
          <span className="text-[11px] font-mono text-[#00A6FC]/70">
            GIHS Agents Engine • Modelos Parametrizados por Setor
          </span>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Ex: Analisar produtividade do Suporte N2 ou gerar ata de reunião..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
            id="input-prompt-ai-hub"
            className="flex-1 px-4 py-3 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00A6FC] font-mono shadow-inner"
          />

          <button
            onClick={() => handleExecute()}
            disabled={executing}
            id="btn-executar-com-ia"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0067FC] via-[#007BFC] to-[#00A6FC] hover:from-[#0052CA] hover:to-[#008BEB] disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-[#0067FC]/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            {executing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Processando Agente...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Executar com GIHS Agents</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-semibold">Sugestões Rápidas:</span>
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(sug);
                handleExecute(sug);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#01122D] hover:bg-[#0067FC]/20 text-slate-300 hover:text-[#00A6FC] border border-[#0A2854] transition-colors cursor-pointer text-left"
            >
              ⚡ {sug}
            </button>
          ))}
        </div>

        {/* Output Box */}
        {generatedOutput && (
          <div
            id="ai-output-box"
            className="mt-4 p-5 rounded-xl bg-[#01122D] border border-[#00A6FC]/50 text-xs text-slate-200 space-y-3 font-mono leading-relaxed animate-in fade-in duration-200 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#0A2854]">
              <span className="text-[#00A6FC] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
                Resultado da Execução do Agente GIHS
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#041838] hover:bg-[#0067FC] text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-[12px] text-slate-300">
              {generatedOutput}
            </pre>
          </div>
        )}
      </div>

      {/* AI Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AI_TOOLS_DATA.map((tool) => {
          return (
            <div
              key={tool.id}
              id={`ai-tool-card-${tool.id}`}
              onClick={() => {
                setPrompt(`Executar ${tool.title} com parâmetros operacionais da empresa.`);
                handleExecute(`Executar ${tool.title} com parâmetros operacionais da empresa.`);
              }}
              className="p-5 rounded-2xl bg-[#041838] border border-[#0A2854] hover:border-[#00A6FC]/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-[#01122D] group-hover:bg-[#0067FC]/20 text-[#00A6FC] border border-[#0A2854] transition-colors">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-[#00A6FC] bg-[#0067FC]/15 border border-[#0067FC]/30 px-2 py-0.5 rounded">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-[#00A6FC] transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#0A2854] flex items-center justify-between text-xs text-[#00A6FC] font-semibold">
                <span>Ativar agente</span>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
