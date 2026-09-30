import React, { useState } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  PhoneCall,
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { CLIENTS_DATA } from '../../data/mockData';
import { ClientEntity } from '../../types';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<ClientEntity[]>(CLIENTS_DATA);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientEntity | null>(CLIENTS_DATA[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('Suporte N1 + N2');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: ClientEntity = {
      id: `cli-${Date.now()}`,
      name: newClientName || 'Novo Cliente Corp',
      plan: newClientPlan,
      sla: '99.5%',
      openTickets: 0,
      monthlyValue: 'R$ 7.500,00',
      contact: 'gestor@cliente.com.br',
      status: 'Ativo'
    };
    setClients([newC, ...clients]);
    setIsModalOpen(false);
    setNewClientName('');
    setToastMessage('✓ Novo cliente e contrato de TI cadastrados no sistema.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Clientes & Contratos de TI</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão de contas corporativas, termos de SLA e controle de chamados contratados
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="btn-novo-cliente"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo cliente</span>
        </button>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
        <input
          type="text"
          placeholder="Pesquisar cliente ou plano de atendimento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SLA {client.sla}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {client.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{client.name}</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">{client.plan}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Chamados Abertos</span>
                <span className="font-bold text-amber-400 text-sm">{client.openTickets}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Mensalidade</span>
                <span className="font-bold text-white text-xs">{client.monthlyValue}</span>
              </div>
            </div>

            {/* Ações solicitadas pelo usuário:
                - Ver chamados abertos
                - Ver contrato
                - Abrir chamado */}
            <div className="space-y-1.5 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToastMessage(`✓ Exibindo fila de ${client.openTickets} chamados do cliente ${client.name}.`);
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ver chamados abertos</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToastMessage(`✓ Contrato SLA 99.5% de ${client.name} autenticado no cofre digital.`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>Ver contrato</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToastMessage(`✓ Novo chamado aberto para ${client.name}. Notificando Suporte N1/N2.`);
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Abrir chamado</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: + Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Cadastrar Novo Cliente B2B
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razão Social ou Nome Fantasia
                </label>
                <input
                  type="text"
                  placeholder="Ex: Grupo Alpha Logística S.A."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Escopo de Atendimento
                </label>
                <select
                  value={newClientPlan}
                  onChange={(e) => setNewClientPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Suporte N1 + N2">Suporte N1 + N2 (24x7)</option>
                  <option value="Infraestrutura & Cloud">Infraestrutura & Cloud</option>
                  <option value="Cyber Security & DBA">Cyber Security & DBA</option>
                  <option value="Full Stack & E-commerce">Full Stack & E-commerce</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
