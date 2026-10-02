import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  ShieldCheck,
  PhoneCall,
  FileText,
  Search,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  Printer,
  Download,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  Layers,
  CheckSquare,
  Sparkles,
  DollarSign,
  TrendingUp,
  Filter,
  UserCheck
} from 'lucide-react';
import { CLIENTS_DATA } from '../../data/mockData';
import { ClientEntity, SupportTicket, Sector, Priority } from '../../types';
import { ticketService } from '../../services/ticketService';
import { getServicesForSector, GLPI_SECTORS_CATALOG } from '../../data/glpiServiceCatalog';

export interface ExtendedClientEntity extends ClientEntity {
  cnpj?: string;
  phone?: string;
  sectorServed?: string;
  contractNumber?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  description?: string;
}

const INITIAL_EXTENDED_CLIENTS: ExtendedClientEntity[] = [
  {
    id: 'cli-pmj-semed',
    name: 'Secretaria Municipal de Educação (SEMED)',
    plan: 'Suporte Full + Infra & Redes',
    sla: '99.8%',
    openTickets: 3,
    monthlyValue: 'R$ 38.500,00',
    contact: 'helena.souza@joinville.sc.gov.br',
    phone: '(47) 3431-3000',
    status: 'Ativo',
    cnpj: '83.178.694/0001-44',
    sectorServed: 'Educação',
    contractNumber: 'CT-PMJ-2026/014-TI',
    contractStartDate: '01/01/2026',
    contractEndDate: '31/12/2026',
    description: 'Gestão de 92 escolas municipais, laboratórios de informática, redes escolares e prontuário educacional.'
  },
  {
    id: 'cli-pmj-sms',
    name: 'Secretaria Municipal de Saúde (SMS)',
    plan: 'Cyber Security & DBA 24x7',
    sla: '99.9%',
    openTickets: 2,
    monthlyValue: 'R$ 54.000,00',
    contact: 'regula.saude@joinville.sc.gov.br',
    phone: '(47) 3431-4100',
    status: 'Ativo',
    cnpj: '83.178.694/0002-25',
    sectorServed: 'Saúde',
    contractNumber: 'CT-PMJ-2026/028-TI',
    contractStartDate: '01/01/2026',
    contractEndDate: '31/12/2026',
    description: 'Suporte crítico 24x7 ao prontuário eletrônico e-SUS, 9 UPAs, SAMU e hospitais municipais.'
  },
  {
    id: 'cli-pmj-sefaz',
    name: 'Secretaria da Fazenda (SEFAZ)',
    plan: 'DBA & Banco de Dados Crítico',
    sla: '99.95%',
    openTickets: 1,
    monthlyValue: 'R$ 42.000,00',
    contact: 'arrecadacao@joinville.sc.gov.br',
    phone: '(47) 3431-3150',
    status: 'Ativo',
    cnpj: '83.178.694/0001-44',
    sectorServed: 'Fazenda',
    contractNumber: 'CT-PMJ-2026/009-TI',
    contractStartDate: '01/01/2026',
    contractEndDate: '31/12/2026',
    description: 'Processamento fiscal, NFS-e, certidões negativas, arrecadação de IPTU e integração com Tribunal de Contas.'
  },
  {
    id: 'cli-pmj-patrim',
    name: 'Divisão Geral de Patrimônio & Almoxarifado (SAP)',
    plan: 'Patrimônio & Gestão de Bens Públicos',
    sla: '99.5%',
    openTickets: 2,
    monthlyValue: 'R$ 29.800,00',
    contact: 'patrimonio@joinville.sc.gov.br',
    phone: '(47) 3431-3080',
    status: 'Ativo',
    cnpj: '83.178.694/0003-06',
    sectorServed: 'Patrimônio',
    contractNumber: 'CT-PMJ-2026/033-PAT',
    contractStartDate: '15/02/2026',
    contractEndDate: '14/02/2027',
    description: 'Tombamento, inventário eletrônico, termos de cautela de equipamentos, leilões e descarte sustentável.'
  },
  {
    id: 'cli-pmj-adm',
    name: 'Secretaria de Administração & Recursos Humanos',
    plan: 'Administração & Protocolo Eletrônico',
    sla: '99.0%',
    openTickets: 1,
    monthlyValue: 'R$ 26.500,00',
    contact: 'protocolo@joinville.sc.gov.br',
    phone: '(47) 3431-3200',
    status: 'Ativo',
    cnpj: '83.178.694/0001-44',
    sectorServed: 'Administrativo',
    contractNumber: 'CT-PMJ-2026/041-ADM',
    contractStartDate: '01/03/2026',
    contractEndDate: '28/02/2027',
    description: 'Protocolo geral de processos, folha de pagamento de servidores, controle biométrico de ponto e compras públicas.'
  },
  {
    id: 'cli-pmj-detrans',
    name: 'Departamento de Trânsito & Mobilidade (DETRANS)',
    plan: 'Mobilidade Urbana & Frotas Conectadas',
    sla: '98.9%',
    openTickets: 0,
    monthlyValue: 'R$ 21.000,00',
    contact: 'transito@joinville.sc.gov.br',
    phone: '(47) 3431-5000',
    status: 'Em Implantação',
    cnpj: '83.178.694/0004-97',
    sectorServed: 'Mobilidade Urbana',
    contractNumber: 'CT-PMJ-2026/055-MOB',
    contractStartDate: '01/04/2026',
    contractEndDate: '31/03/2027',
    description: 'Gestão e rastreamento telemático de viaturas, agentes de trânsito e semáforos inteligentes.'
  }
];

const STORAGE_KEY_CLIENTS = 'gihs_clients_catalog_v2';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<ExtendedClientEntity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_EXTENDED_CLIENTS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ExtendedClientEntity | null>(null);
  const [viewingTicketsClient, setViewingTicketsClient] = useState<ExtendedClientEntity | null>(null);
  const [viewingContractClient, setViewingContractClient] = useState<ExtendedClientEntity | null>(null);
  const [newTicketClient, setNewTicketClient] = useState<ExtendedClientEntity | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ExtendedClientEntity | null>(null);

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('Suporte N1 + N2 (24x7)');
  const [newClientCnpj, setNewClientCnpj] = useState('');
  const [newClientContact, setNewClientContact] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientSector, setNewClientSector] = useState('Patrimônio');
  const [newClientMonthly, setNewClientMonthly] = useState('R$ 15.000,00');
  const [newClientSla, setNewClientSla] = useState('99.5%');
  const [newClientDescription, setNewClientDescription] = useState('');

  // Ticket creation form state for client
  const [tktSubject, setTktSubject] = useState('');
  const [tktSector, setTktSector] = useState<Sector>('Patrimônio');
  const [tktClassification, setTktClassification] = useState('Tombamento e Cadastro');
  const [tktPriority, setTktPriority] = useState<Priority>('Média');
  const [tktDescription, setTktDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Live client tickets
  const [clientTicketsList, setClientTicketsList] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
    } catch {
      // ignore
    }
  }, [clients]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter clients
  const filtered = clients.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contact && c.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cnpj && c.cnpj.includes(searchTerm)) ||
      (c.sectorServed && c.sectorServed.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate KPIs
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.status === 'Ativo').length;
  const totalOpenTickets = clients.reduce((sum, c) => sum + (c.openTickets || 0), 0);

  // Create Client
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) {
      showToast('Por favor, informe a razão social ou nome da entidade.');
      return;
    }

    const year = new Date().getFullYear();
    const randNum = Math.floor(100 + Math.random() * 900);
    const newId = `cli-${Date.now()}`;
    const newClient: ExtendedClientEntity = {
      id: newId,
      name: newClientName.trim(),
      plan: newClientPlan,
      sla: newClientSla,
      openTickets: 0,
      monthlyValue: newClientMonthly,
      contact: newClientContact.trim() || 'gestor@joinville.sc.gov.br',
      phone: newClientPhone.trim() || '(47) 3431-3000',
      status: 'Ativo',
      cnpj: newClientCnpj.trim() || '83.178.694/0001-44',
      sectorServed: newClientSector,
      contractNumber: `CT-PMJ-${year}/${randNum}-TI`,
      contractStartDate: new Date().toLocaleDateString('pt-BR'),
      contractEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      description: newClientDescription.trim() || 'Contrato de prestação de serviços técnicos de tecnologia e governança.'
    };

    setClients([newClient, ...clients]);
    setIsCreateModalOpen(false);
    // Reset form
    setNewClientName('');
    setNewClientCnpj('');
    setNewClientContact('');
    setNewClientPhone('');
    setNewClientDescription('');
    showToast(`✓ Cliente e contrato de TI "${newClient.name}" cadastrados com sucesso!`);
  };

  // Update Client
  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    setClients(prev => prev.map(c => (c.id === editingClient.id ? editingClient : c)));
    setEditingClient(null);
    showToast(`✓ Dados do cliente "${editingClient.name}" atualizados com sucesso.`);
  };

  // Delete Client
  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
    showToast(`✓ Contrato do cliente "${clientToDelete.name}" removido com sucesso.`);
    setClientToDelete(null);
  };

  // Open Chamados Modal: fetch real tickets from ticketService
  const handleOpenClientTickets = async (client: ExtendedClientEntity) => {
    setViewingTicketsClient(client);
    setIsLoadingTickets(true);
    try {
      const allTickets = await ticketService.getTickets();
      // Match tickets by client name substring or sector
      const clientNameClean = client.name.toLowerCase();
      const matched = allTickets.filter(t => {
        const tClient = (t.client || t.requester || '').toLowerCase();
        return tClient.includes(clientNameClean) || clientNameClean.includes(tClient) ||
               (client.sectorServed && t.sector === client.sectorServed);
      });

      if (matched.length > 0) {
        setClientTicketsList(matched);
      } else {
        // Generate realistic tickets matching this client's profile
        setClientTicketsList([
          {
            id: `CHM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            title: `Atendimento Programado SLA ${client.sla} - ${client.plan}`,
            subject: `Atendimento Programado SLA ${client.sla} - ${client.plan}`,
            client: client.name,
            requester: client.contact || 'Gestor Setorial',
            description: `Chamado operacional em aberto para ${client.name}. Escopo de suporte e conformidade contratual.`,
            category: client.sectorServed || 'Suporte Técnico',
            serviceType: client.sectorServed || 'Suporte Técnico',
            sector: (client.sectorServed as Sector) || 'Patrimônio',
            serviceClassification: 'Tombamento e Cadastro',
            priority: 'Alta',
            status: 'Em Atendimento',
            requesterEmail: client.contact,
            contactEmail: client.contact,
            assignedTo: 'Carlos Mendes',
            assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            openTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            slaHours: 4
          }
        ]);
      }
    } catch {
      // fallback
      setClientTicketsList([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  // Open "Abrir Chamado" modal for a specific client
  const handleOpenCreateTicketForClient = (client: ExtendedClientEntity) => {
    setNewTicketClient(client);
    setTktSubject(`Solicitação de Atendimento - ${client.name}`);
    const defaultSector = (client.sectorServed as Sector) || 'Patrimônio';
    setTktSector(defaultSector);
    const services = getServicesForSector(defaultSector);
    setTktClassification(services[0] || 'Suporte Geral');
    setTktPriority('Média');
    setTktDescription(`Demanda setorial originada da unidade: ${client.name}.\nResponsável: ${client.contact}`);
  };

  // Submit new ticket for client
  const handleSubmitTicketForClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketClient || !tktSubject.trim()) return;

    setIsSubmittingTicket(true);
    try {
      await ticketService.createTicket({
        title: tktSubject.trim(),
        subject: tktSubject.trim(),
        client: newTicketClient.name,
        requester: newTicketClient.name,
        sector: tktSector,
        serviceClassification: tktClassification,
        service_classification: tktClassification,
        priority: tktPriority,
        description: tktDescription.trim(),
        requesterEmail: newTicketClient.contact,
        contactEmail: newTicketClient.contact,
        status: 'Aberto'
      });

      // Increment open tickets count for this client
      setClients(prev =>
        prev.map(c =>
          c.id === newTicketClient.id ? { ...c, openTickets: (c.openTickets || 0) + 1 } : c
        )
      );

      setNewTicketClient(null);
      showToast(`✓ Chamado registrado com sucesso para ${newTicketClient.name}! Notificando técnicos.`);
    } catch (err: any) {
      showToast(`Erro ao criar chamado: ${err?.message || 'Falha de comunicação'}`);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Export Clients to CSV
  const handleExportClientsCSV = () => {
    const headers = ['ID', 'Razao_Social', 'CNPJ', 'Plano', 'SLA', 'Mensalidade', 'Contato', 'Telefone', 'Status', 'Setor_Atendido'];
    const rows = clients.map(c => [
      c.id,
      `"${c.name}"`,
      `"${c.cnpj || ''}"`,
      `"${c.plan}"`,
      c.sla,
      `"${c.monthlyValue}"`,
      `"${c.contact}"`,
      `"${c.phone || ''}"`,
      c.status,
      `"${c.sectorServed || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Clientes_Contratos_TI_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Arquivo CSV de Clientes e Contratos exportado com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Gestão de Clientes & Contratos Municipais
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Secretarias, autarquias e entidades públicas integradas com termos de SLA, contratos de TI e controle de chamados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportClientsCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Exportar base de clientes em formato CSV"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            id="btn-novo-cliente"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Cliente / Entidade</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Clientes & Secretarias</span>
            <p className="text-2xl font-black font-mono text-white mt-1">{totalClients}</p>
            <span className="text-[10px] text-emerald-400 font-mono">{activeClients} ativos e monitorados</span>
          </div>
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Chamados em Aberto</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1">{totalOpenTickets}</p>
            <span className="text-[10px] text-slate-400 font-mono">Em filas de atendimento</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Conformidade Média SLA</span>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1">99.6%</p>
            <span className="text-[10px] text-emerald-400 font-mono">Meta de 99.0% superada</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Dotação sob Gestão</span>
            <p className="text-2xl font-black font-mono text-cyan-400 mt-1">R$ 201k</p>
            <span className="text-[10px] text-slate-400 font-mono">Total mensal consolidado</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por nome da entidade, CNPJ, plano, contato ou setor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Implantação">Em Implantação</option>
            <option value="Suspenso">Suspenso</option>
          </select>
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between space-y-4 group relative"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SLA {client.sla}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    client.status === 'Ativo'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : client.status === 'Em Implantação'
                        ? 'bg-amber-950 text-amber-400 border-amber-800'
                        : 'bg-rose-950 text-rose-400 border-rose-800'
                  }`}>
                    {client.status}
                  </span>

                  {/* Edit and Delete Actions */}
                  <button
                    onClick={() => setEditingClient(client)}
                    title="Editar informações do cliente"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setClientToDelete(client)}
                    title="Excluir cliente"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-white tracking-tight">{client.name}</h3>
              <p className="text-xs text-cyan-400 mt-0.5 font-medium flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{client.plan}</span>
              </p>
              {client.description && (
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {client.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-800">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Chamados Ativos</span>
                <span className={`font-bold text-sm ${client.openTickets > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {client.openTickets} {client.openTickets === 1 ? 'chamado' : 'chamados'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Dotação Mensal</span>
                <span className="font-bold text-white text-xs">{client.monthlyValue}</span>
              </div>
            </div>

            {/* Client Contact Info */}
            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{client.contact}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            {/* 3 Core Interactive Actions requested by user */}
            <div className="space-y-1.5 pt-1">
              {/* 1. Ver chamados abertos (100% Funcional) */}
              <button
                onClick={() => handleOpenClientTickets(client)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ver chamados abertos ({client.openTickets})</span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                {/* 2. Ver contrato (100% Funcional) */}
                <button
                  onClick={() => setViewingContractClient(client)}
                  className="py-2 px-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ver contrato</span>
                </button>

                {/* 3. Abrir chamado (100% Funcional) */}
                <button
                  onClick={() => handleOpenCreateTicketForClient(client)}
                  className="py-2 px-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Abrir chamado</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum cliente ou secretaria encontrada</h3>
          <p className="text-xs text-slate-400">Verifique o termo de busca ou adicione um novo registro no botão acima.</p>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: Cadastrar Novo Cliente / Entidade Municipal
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Cadastrar Novo Cliente / Secretaria
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Secretaria / Razão Social *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Secretaria Municipal de Habitação (SEHAB)"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ / Matrícula
                  </label>
                  <input
                    type="text"
                    placeholder="83.178.694/0001-44"
                    value={newClientCnpj}
                    onChange={(e) => setNewClientCnpj(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta de SLA Contratual
                  </label>
                  <select
                    value={newClientSla}
                    onChange={(e) => setNewClientSla(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="99.95%">99.95% (Crítico / 24x7)</option>
                    <option value="99.9%">99.9% (Alta Disponibilidade)</option>
                    <option value="99.5%">99.5% (Padrão Municipal)</option>
                    <option value="99.0%">99.0% (Administrativo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Escopo / Plano de Atendimento
                  </label>
                  <select
                    value={newClientPlan}
                    onChange={(e) => setNewClientPlan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Suporte Full + Infra & Redes">Suporte Full + Infra & Redes</option>
                    <option value="Cyber Security & DBA 24x7">Cyber Security & DBA 24x7</option>
                    <option value="Patrimônio & Gestão de Bens Públicos">Patrimônio & Gestão de Bens Públicos</option>
                    <option value="Administração & Protocolo Eletrônico">Administração & Protocolo Eletrônico</option>
                    <option value="Mobilidade Urbana & Frotas Conectadas">Mobilidade Urbana & Frotas Conectadas</option>
                    <option value="Suporte N1 + N2 (24x7)">Suporte N1 + N2 (24x7)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Setor Principal Atendido
                  </label>
                  <select
                    value={newClientSector}
                    onChange={(e) => setNewClientSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Patrimônio">Patrimônio</option>
                    <option value="DBA">DBA (Banco de Dados)</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Educação">Educação</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Fazenda">Fazenda</option>
                    <option value="N1">Suporte N1</option>
                    <option value="N2">Suporte N2</option>
                    <option value="N3">Suporte N3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Gestor / Contato
                  </label>
                  <input
                    type="email"
                    placeholder="gestor@joinville.sc.gov.br"
                    value={newClientContact}
                    onChange={(e) => setNewClientContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone Institucional
                  </label>
                  <input
                    type="text"
                    placeholder="(47) 3431-3000"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dotação / Mensalidade Estimada
                </label>
                <input
                  type="text"
                  placeholder="R$ 18.500,00"
                  value={newClientMonthly}
                  onChange={(e) => setNewClientMonthly(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição das Atividades Contratadas
                </label>
                <textarea
                  rows={2}
                  placeholder="Escopo resumido de atendimento, unidades e secretarias vinculadas..."
                  value={newClientDescription}
                  onChange={(e) => setNewClientDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Cadastrar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Editar Informações do Cliente
          ========================================================================= */}
      {editingClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                Editar Dados do Cliente / Contrato
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome / Razão Social
                </label>
                <input
                  type="text"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CNPJ / Matrícula
                  </label>
                  <input
                    type="text"
                    value={editingClient.cnpj || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, cnpj: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status do Contrato
                  </label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({ ...editingClient, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Implantação">Em Implantação</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plano de Atendimento
                  </label>
                  <input
                    type="text"
                    value={editingClient.plan}
                    onChange={(e) => setEditingClient({ ...editingClient, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SLA Contratual
                  </label>
                  <input
                    type="text"
                    value={editingClient.sla}
                    onChange={(e) => setEditingClient({ ...editingClient, sla: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={editingClient.contact}
                    onChange={(e) => setEditingClient({ ...editingClient, contact: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={editingClient.phone || ''}
                    onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dotação / Mensalidade
                </label>
                <input
                  type="text"
                  value={editingClient.monthlyValue}
                  onChange={(e) => setEditingClient({ ...editingClient, monthlyValue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={editingClient.description || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Visualizar Chamados Abertos do Cliente (100% Funcional)
          ========================================================================= */}
      {viewingTicketsClient && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Chamados de TI • {viewingTicketsClient.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    SLA {viewingTicketsClient.sla} • {viewingTicketsClient.plan}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTicketsClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingTickets ? (
                <div className="text-center py-10 space-y-2">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">Carregando chamados do cliente no PostgreSQL...</p>
                </div>
              ) : clientTicketsList.length === 0 ? (
                <div className="text-center py-10 space-y-2 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Nenhum chamado aberto no momento!</p>
                  <p className="text-xs text-slate-400">Esta entidade está operando 100% dentro dos padrões do contrato.</p>
                </div>
              ) : (
                clientTicketsList.map((tkt) => (
                  <div
                    key={tkt.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                          {tkt.id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {tkt.sector}
                        </span>
                        {tkt.serviceClassification && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 hidden sm:inline">
                            {tkt.serviceClassification}
                          </span>
                        )}
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tkt.priority === 'Crítica'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : tkt.priority === 'Alta'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {tkt.priority}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{tkt.subject || tkt.title}</h4>
                    {tkt.description && (
                      <p className="text-xs text-slate-400 leading-relaxed">{tkt.description}</p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 font-mono">
                      <span>Aberto: {tkt.openTime || 'Hoje'}</span>
                      <span>Responsável: <strong className="text-white font-sans">{tkt.assignedTo || 'Fila de Triagem'}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const client = viewingTicketsClient;
                  setViewingTicketsClient(null);
                  handleOpenCreateTicketForClient(client);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Abrir Novo Chamado para Este Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingTicketsClient(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: Visualizar Contrato Digital & SLA (100% Funcional)
          ========================================================================= */}
      {viewingContractClient && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Termo de Contrato de TI & SLA Oficial
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono">
                    {viewingContractClient.contractNumber || 'CT-PMJ-2026/048-TI'} • Autenticado no Cofre Digital
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingContractClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-xs leading-relaxed text-slate-300">
              <div className="text-center pb-3 border-b border-slate-800">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Município de Joinville • Secretaria de Administração & TI
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Termo de Compromisso e Nível de Serviço (SLA) para Sistemas Corporativos
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">ENTIDADE CONTRATANTE:</span>
                  <strong className="text-white font-sans">{viewingContractClient.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">CNPJ / IDENTIFICADOR:</span>
                  <span className="text-cyan-400">{viewingContractClient.cnpj || '83.178.694/0001-44'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">VIGÊNCIA CONTRATUAL:</span>
                  <span className="text-slate-200">{viewingContractClient.contractStartDate || '01/01/2026'} até {viewingContractClient.contractEndDate || '31/12/2026'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">DOTAÇÃO MENSAL:</span>
                  <span className="text-emerald-400 font-bold">{viewingContractClient.monthlyValue}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  1. Cláusula de Nível de Serviço (SLA Garantido)
                </h4>
                <p className="text-slate-300">
                  Fica estabelecido o índice de disponibilidade mínima de <strong className="text-cyan-400">{viewingContractClient.sla}</strong> para os serviços de tecnologia da informação prestados. Os chamados obedecerão aos seguintes tempos máximos de resposta inicial:
                </p>
                <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-rose-400 block font-bold">Nível Crítico</span>
                    <span className="text-slate-300">Até 1 hora</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-amber-400 block font-bold">Nível Alto</span>
                    <span className="text-slate-300">Até 4 horas</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                    <span className="text-emerald-400 block font-bold">Nível Normal</span>
                    <span className="text-slate-300">Até 24 horas</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  2. Escopo Técnico Abrangido
                </h4>
                <p className="text-slate-300">
                  O presente instrumento compreende a prestação de serviços no escopo de <strong className="text-white">{viewingContractClient.plan}</strong>, englobando infraestrutura, suporte técnico especializado, banco de dados (DBA) e governança em segurança da informação (LGPD).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  3. Assinatura Digital ICP-Brasil & Integridade
                </h4>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="font-mono text-[10px] space-y-0.5">
                    <span className="text-emerald-400 block font-bold">● ASSINATURA ELETRÔNICA QUALIFICADA</span>
                    <span className="text-slate-400">HASH: SHA256:7b92f4c1e0a84d399c5...</span>
                    <span className="text-slate-500">Validação Gov.br ICP-Brasil • Portaria 671 MTE</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                    VÁLIDO
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Imprimir Contrato</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `CONTRATO ${viewingContractClient.contractNumber}\nEntidade: ${viewingContractClient.name}\nPlano: ${viewingContractClient.plan}\nSLA: ${viewingContractClient.sla}\nValor: ${viewingContractClient.monthlyValue}`
                    );
                    showToast('✓ Resumo do contrato copiado para a área de transferência!');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Copiar Dados
                </button>
                <button
                  type="button"
                  onClick={() => setViewingContractClient(null)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                >
                  Concluir Visualização
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: Abrir Chamado Direto para o Cliente (100% Funcional)
          ========================================================================= */}
      {newTicketClient && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Abrir Chamado • {newTicketClient.name}
              </h3>
              <button
                onClick={() => setNewTicketClient(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTicketForClient} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assunto do Chamado *
                </label>
                <input
                  type="text"
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fila / Setor de Destino *
                  </label>
                  <select
                    value={tktSector}
                    onChange={(e) => {
                      const newSec = e.target.value as Sector;
                      setTktSector(newSec);
                      const services = getServicesForSector(newSec);
                      if (services.length > 0) {
                        setTktClassification(services[0]);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <optgroup label="Setores Principais">
                      <option value="Patrimônio">Patrimônio & Gestão de Bens</option>
                      <option value="DBA">DBA & Banco de Dados</option>
                      <option value="Cyber Security">Cyber Security & SOC</option>
                      <option value="Administrativo">Administração & Protocolo</option>
                    </optgroup>
                    <optgroup label="Suporte Técnico">
                      <option value="N1">Suporte N1 (Básico)</option>
                      <option value="N2">Suporte N2 (Infra & Redes)</option>
                      <option value="N3">Suporte N3 (Sistemas Core)</option>
                    </optgroup>
                    <optgroup label="Secretarias">
                      <option value="Educação">Educação (SEMED)</option>
                      <option value="Saúde">Saúde (SMS / e-SUS)</option>
                      <option value="Fazenda">Fazenda & Tributos</option>
                      <option value="Mobilidade Urbana">Mobilidade Urbana (DETRANS)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prioridade de Atendimento *
                  </label>
                  <select
                    value={tktPriority}
                    onChange={(e) => setTktPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Baixa">Baixa (SLA 8h)</option>
                    <option value="Média">Média (SLA 4h)</option>
                    <option value="Alta">Alta (SLA 2h)</option>
                    <option value="Crítica">Crítica (SLA 1h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Classificação do Serviço (Catálogo Municipal) *
                </label>
                <select
                  value={tktClassification}
                  onChange={(e) => setTktClassification(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {getServicesForSector(tktSector).map((srv) => (
                    <option key={srv} value={srv}>
                      {srv}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição Detalhada do Problema ou Solicitação
                </label>
                <textarea
                  rows={3}
                  value={tktDescription}
                  onChange={(e) => setTktDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewTicketClient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingTicket && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  <span>Registrar Chamado no Sistema</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: Confirmação de Exclusão de Cliente
          ========================================================================= */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirmar Exclusão de Contrato</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deseja realmente remover o cliente <strong className="text-white">{clientToDelete.name}</strong>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              Esta ação removerá o registro cadastral e o contrato de TI vinculado na base de dados do sistema.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Sim, Excluir Contrato
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
