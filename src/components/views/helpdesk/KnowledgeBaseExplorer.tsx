import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  ChevronRight,
  X
} from 'lucide-react';
import { KnowledgeArticle, Sector, Collaborator } from '../../../types';
import { activitySyncService } from '../../../services/activitySyncService';
import { apiBackendService } from '../../../services/apiBackendService';
import { SECTORS } from '../../../data/mockData';

interface KnowledgeBaseExplorerProps {
  currentUser: Collaborator;
  onUseArticleForTicket?: (article: KnowledgeArticle) => void;
}

export const KnowledgeBaseExplorer: React.FC<KnowledgeBaseExplorerProps> = ({
  currentUser,
  onUseArticleForTicket
}) => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>(() => activitySyncService.getKnowledgeBase());
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isNewArticleModalOpen, setIsNewArticleModalOpen] = useState(false);

  // Load from PostgreSQL backend
  React.useEffect(() => {
    let isMounted = true;
    apiBackendService.getKnowledgeArticles().then((res) => {
      if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setArticles(res.data);
      }
    }).catch((err) => {
      console.warn('PostgreSQL knowledge base fetch warning:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // New Article Form state
  const [newTitle, setNewTitle] = useState('');
  const [newSector, setNewSector] = useState<Sector>(currentUser.sector || 'N1');
  const [newServiceType, setNewServiceType] = useState('');
  const [newCategory, setNewCategory] = useState<KnowledgeArticle['category']>('Acessos & Identidade');
  const [newSummary, setNewSummary] = useState('');
  const [newProcedure, setNewProcedure] = useState('');
  const [newMinutes, setNewMinutes] = useState(30);
  const [newTags, setNewTags] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter(art => {
      const matchSearch =
        art.title.toLowerCase().includes(search.toLowerCase()) ||
        art.code.toLowerCase().includes(search.toLowerCase()) ||
        art.summarySolution.toLowerCase().includes(search.toLowerCase()) ||
        art.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
        art.serviceType.toLowerCase().includes(search.toLowerCase());

      const matchSector = sectorFilter === 'TODOS' || art.sector === sectorFilter;
      const matchCategory = categoryFilter === 'TODOS' || art.category === categoryFilter;

      return matchSearch && matchSector && matchCategory;
    });
  }, [articles, search, sectorFilter, categoryFilter]);

  const categories = useMemo(() => {
    return Array.from(new Set(articles.map(a => a.category))).filter(Boolean);
  }, [articles]);

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim() || !newServiceType.trim()) return;

    const procedureSteps = newProcedure
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const article: KnowledgeArticle = {
      id: `KB-CUSTOM-${Date.now()}`,
      code: `${newSector.toUpperCase().slice(0, 3)}-PROC-${String(articles.length + 1).padStart(2, '0')}`,
      title: newTitle.trim(),
      sector: newSector,
      serviceType: newServiceType.trim(),
      category: newCategory,
      summarySolution: newSummary.trim(),
      detailedProcedure: procedureSteps.length > 0 ? procedureSteps : [newSummary.trim()],
      estimatedResolutionMinutes: Number(newMinutes) || 30,
      tags: tagsArray.length > 0 ? tagsArray : ['procedimento', newSector.toLowerCase()],
      usefulCount: 1,
      lastUpdated: new Date().toLocaleDateString('pt-BR'),
      author: currentUser.name
    };

    activitySyncService.addKnowledgeArticle(article);
    setArticles(prev => [article, ...prev]);
    setIsNewArticleModalOpen(false);

    // Persist to PostgreSQL backend
    apiBackendService.createKnowledgeArticle(article).catch(err => {
      console.warn('Error persisting article to PostgreSQL:', err);
    });

    // Reset fields
    setNewTitle('');
    setNewSummary('');
    setNewProcedure('');
    setNewTags('');
    setNewServiceType('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Fase 6 • Base de Conhecimento Corporativa
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {articles.length} Artigos • PostgreSQL
              </span>
            </div>
            <p className="text-xs text-[#37558d] font-medium mt-0.5">
              Acervo técnico de procedimentos padronizados para resolução ágil e fechamento de chamados
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewArticleModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#334b84] hover:bg-[#37558d] text-white text-xs font-bold shadow-md shadow-[#334b84]/20 flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          <span className="text-white">Novo Artigo de Solução</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, código (ex: N1-AUTH, N2-NET, DBA-PERF), tags ou solução..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Sector filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d]"
          >
            <option value="TODOS">Setor: Todos</option>
            {SECTORS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d]"
          >
            <option value="TODOS">Categoria: Todas</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Top metadata */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-[#37558d] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  {article.code}
                </span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                  {article.sector}
                </span>
              </div>

              {/* Title & Service Type */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#37558d] transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">
                  Tipo: <strong className="text-slate-700">{article.serviceType}</strong>
                </span>
              </div>

              {/* Summary Solution */}
              <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {article.summarySolution}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {article.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-[#37558d] bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded-md font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#37558d]" />
                <span>~{article.estimatedResolutionMinutes} min</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-mono text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {article.usefulCount} usos
                </span>
                <button
                  onClick={() => setSelectedArticle(article)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-[#37558d] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Procedimento</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#37558d] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                  {selectedArticle.code}
                </span>
                <span className="text-xs text-slate-500 font-mono">Setor: <strong className="text-slate-700">{selectedArticle.sector}</strong></span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedArticle.title}</h3>
                <p className="text-xs text-[#37558d] font-medium mt-0.5">
                  Tipo de Serviço: {selectedArticle.serviceType} • Categoria: {selectedArticle.category}
                </p>
              </div>

              {/* Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-[#37558d] block">Resumo Padronizado de Fechamento:</span>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedArticle.summarySolution}
                </p>
              </div>

              {/* Step-by-Step Procedure */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 block">
                  Procedimento Técnico Detalhado ({selectedArticle.detailedProcedure.length} passos):
                </span>
                <div className="space-y-2">
                  {selectedArticle.detailedProcedure.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100">
                      <span className="w-5 h-5 rounded-full bg-[#334b84] text-white font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200 font-mono">
                <span>Autor: <strong className="text-slate-700">{selectedArticle.author}</strong></span>
                <span>Última revisão: <strong className="text-slate-700">{selectedArticle.lastUpdated}</strong></span>
                <span>Tempo médio: <strong className="text-[#37558d]">{selectedArticle.estimatedResolutionMinutes} min</strong></span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Article Modal */}
      {isNewArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#37558d] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Novo Artigo na Base de Conhecimento (Fase 6)
                  </h3>
                  <p className="text-[11px] text-slate-500">Documente procedimentos técnicos padronizados</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewArticleModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="p-5 overflow-y-auto space-y-3.5 flex-1 bg-white">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Artigo *</label>
                <input
                  type="text"
                  placeholder="Ex: Reset de Senhas e Pareamento MFA..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Setor Responsável</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value as Sector)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-[#37558d]"
                  >
                    {SECTORS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as KnowledgeArticle['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
                  >
                    <option value="Acessos & Identidade">Acessos & Identidade</option>
                    <option value="Redes & Conectividade">Redes & Conectividade</option>
                    <option value="Bancos de Dados">Bancos de Dados</option>
                    <option value="Aplicações & APIs">Aplicações & APIs</option>
                    <option value="Infraestrutura & Nuvem">Infraestrutura & Nuvem</option>
                    <option value="Segurança & LGPD">Segurança & LGPD</option>
                    <option value="Hardware & Periféricos">Hardware & Periféricos</option>
                    <option value="Sistemas & ERP">Sistemas & ERP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo do Serviço Realizado *</label>
                <input
                  type="text"
                  placeholder="Ex: Reset de Credenciais & 2FA"
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resumo da Solução (Usado ao Finalizar Chamados) *</label>
                <textarea
                  rows={2}
                  placeholder="Resumo conciso que será gravado nas atividades quando este artigo for utilizado..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Passos do Procedimento Detalhado (um por linha)</label>
                <textarea
                  rows={3}
                  placeholder="1. Acessar console de administração&#10;2. Resetar chave de acesso&#10;3. Validar retorno 200 OK..."
                  value={newProcedure}
                  onChange={(e) => setNewProcedure(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] font-mono text-[11px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempo Médio (minutos)</label>
                  <input
                    type="number"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-[#37558d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    placeholder="vpn, rede, wifi"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewArticleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#334b84] hover:bg-[#37558d] text-white font-bold rounded-xl text-xs shadow-md shadow-[#334b84]/20 transition-all cursor-pointer"
                >
                  Salvar Artigo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
