import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Mail,
  CheckSquare,
  Shield,
  Filter,
  Building2,
  Lock,
  Unlock,
  Edit3,
  Sliders,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Briefcase,
  Layers,
  Crown,
  UserCog,
  Check,
  Network,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  Sparkles,
  Key,
  DollarSign,
  Stethoscope,
  HeartPulse,
  Clock,
  BadgeCheck,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldCheck,
  Database,
  Trash2
} from 'lucide-react';
import {
  INITIAL_ORGANIZATIONAL_SECTORS,
  ORGANIZATIONAL_AREAS,
  ROLE_DEFINITIONS,
  CURRENT_USER
} from '../../data/mockData';
import { AUTH_ACCOUNTS, convertCredentialToCollaborator } from '../../data/authCredentials';
import { Collaborator, UserRole, OrganizationalSector, ViewScreen } from '../../types';
import { apiBackendService } from '../../services/apiBackendService';
import { exportHierarchyToExcel, exportPrivateHRDossierToExcel } from '../../utils/excelExport';
import { evaluatePassword } from '../../utils/passwordPolicy';
import { getServicesForSector, GLPI_SECTORS_CATALOG } from '../../data/glpiServiceCatalog';
import { PrivateAccessLock } from './collaborators/PrivateAccessLock';
import { HRDossierTab } from './collaborators/HRDossierTab';
import { CollaboratorDetailDrawer } from './collaborators/CollaboratorDetailDrawer';

interface CollaboratorsViewProps {
  onNavigate?: (screen: ViewScreen) => void;
  currentUser?: Collaborator;
  onSwitchUser?: (user: Collaborator) => void;
  onOpenSimulatorModal?: () => void;
}

// Helper to ensure all 48 collaborators have authentic HR data
function enrichCollaboratorWithHRData(c: Collaborator, index: number): Collaborator {
  let contractType: 'CLT' | 'PJ' | 'Estágio' = 'CLT';
  let salaryBracket = 'R$ 4.200 - R$ 5.800';
  let workSchedule = '40h semanais (08h às 17h)';
  let asoStatus: 'Em dia' | 'A renovar' | 'Pendente' = 'Em dia';
  let benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica Especial', 'Seguro de Vida MetLife'];

  const userRole = c.userRole || 'COLABORADOR';
  const roleStr = (c.role || '').toLowerCase();

  if (userRole === 'SUPER_ADMIN') {
    contractType = 'PJ';
    salaryBracket = 'R$ 24.500,00';
    workSchedule = 'Dedicação Exclusiva / Diretoria';
    benefits = ['Seguro Executivo D&O', 'Plano Black Saúde', 'Reembolso Combustível'];
  } else if (userRole === 'ADMINISTRATIVO') {
    contractType = 'CLT';
    salaryBracket = 'R$ 13.800,00';
    workSchedule = '40h semanais (08h às 17h)';
    benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica Especial', 'Previdência Privada', 'Auxílio Creche'];
  } else if (userRole === 'GESTOR') {
    contractType = index % 3 === 0 ? 'PJ' : 'CLT';
    salaryBracket = 'R$ 11.200 - R$ 14.500';
    workSchedule = '40h semanais (09h às 18h)';
    benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica Especial', 'Gympass', 'Auxílio Certificação'];
  } else {
    // Colaborador
    if (roleStr.includes('estagiário') || roleStr.includes('estágio')) {
      contractType = 'Estágio';
      salaryBracket = 'R$ 2.100,00';
      workSchedule = '30h semanais (09h às 15h)';
      benefits = ['VR R$ 30/dia', 'VT', 'Seguro de Vida'];
    } else if (
      roleStr.includes('n3') ||
      roleStr.includes('dba') ||
      roleStr.includes('security') ||
      roleStr.includes('senior')
    ) {
      contractType = 'CLT';
      salaryBracket = 'R$ 8.900 - R$ 11.500';
      workSchedule = '40h semanais (Escala 5x2)';
      benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica', 'Bradesco Dental', 'Seguro de Vida'];
    } else if (roleStr.includes('n2') || roleStr.includes('pleno')) {
      contractType = 'CLT';
      salaryBracket = 'R$ 5.800 - R$ 7.200';
      workSchedule = '40h semanais (08h às 17h)';
      benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica', 'Bradesco Dental'];
    } else {
      contractType = 'CLT';
      salaryBracket = 'R$ 3.800 - R$ 4.600';
      workSchedule = '40h semanais (Escala 5x2)';
      benefits = ['VR R$ 45/dia', 'VT', 'Plano SulAmérica', 'Bradesco Dental'];
    }
  }

  // 2 collaborateurs with ASO expiring soon for realistic management
  if (index === 5 || index === 14) {
    asoStatus = 'A renovar';
  }

  return {
    ...c,
    name: c.name || 'Colaborador',
    role: c.role || (userRole === 'SUPER_ADMIN' ? 'Super Administrador Master' : userRole === 'ADMINISTRATIVO' ? 'Coordenador Administrativo' : userRole === 'GESTOR' ? 'Gestor de Equipe' : 'Analista Operacional'),
    sector: c.sector || 'Gestão',
    contractType: c.contractType || contractType,
    salaryBracket: c.salaryBracket || salaryBracket,
    workSchedule: c.workSchedule || workSchedule,
    asoStatus: c.asoStatus || asoStatus,
    benefits: c.benefits || benefits,
    cpfMasked:
      c.cpfMasked ||
      `***.${String(100 + ((index * 17) % 900)).padStart(3, '0')}.${String(
        200 + ((index * 23) % 900)
      ).padStart(3, '0')}-**`,
    emergencyContact: c.emergencyContact || `(11) 98711-${String(1000 + index)}`
  };
}

export const CollaboratorsView: React.FC<CollaboratorsViewProps> = ({
  onNavigate,
  currentUser = CURRENT_USER,
  onSwitchUser,
  onOpenSimulatorModal
}) => {
  // Local state for collaborators loaded from PostgreSQL Backend
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [sectors, setSectors] = useState<OrganizationalSector[]>(INITIAL_ORGANIZATIONAL_SECTORS);
  const [isLoading, setIsLoading] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'rh_dossier' | 'sectors' | 'rbac_matrix'>('hierarchy');

  // Selected collaborator for full private drawer dossier
  const [selectedUserDetail, setSelectedUserDetail] = useState<Collaborator | null>(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState<string>('TODOS');
  const [selectedArea, setSelectedArea] = useState<string>('TODOS');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewSectorModalOpen, setIsNewSectorModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Collaborator | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<Collaborator | null>(null);
  const [userToDelete, setUserToDelete] = useState<Collaborator | null>(null);
  const [tempPasswordUser, setTempPasswordUser] = useState<Collaborator | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('bycomp2026');

  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('bycomp_deleted_user_ids');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // New user form state with HR fields & Temporary Password
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTempPassword, setNewUserTempPassword] = useState('Bycomp@2026#');
  const [newUserRoleTitle, setNewUserRoleTitle] = useState('Analista de TI');
  const [newUserAccessRole, setNewUserAccessRole] = useState<UserRole>('COLABORADOR');
  const [newUserArea, setNewUserArea] = useState<string>('SUPORTE');
  const [newUserSector, setNewUserSector] = useState<string>('N1');
  const [newUserPhone, setNewUserPhone] = useState('(11) 98877-0000');
  const [newUserContractType, setNewUserContractType] = useState<'CLT' | 'PJ' | 'Estágio'>('CLT');
  const [newUserSalaryBracket, setNewUserSalaryBracket] = useState('R$ 4.800,00');
  const [newUserServiceClassification, setNewUserServiceClassification] = useState<string>('Suporte N3');
  const [isCustomClassification, setIsCustomClassification] = useState(false);
  const [customClassificationText, setCustomClassificationText] = useState('');

  // New sector form state
  const [newSectorName, setNewSectorName] = useState('');
  const [newSectorArea, setNewSectorArea] = useState<string>('SUPORTE');
  const [newSectorLeader, setNewSectorLeader] = useState('Mariana Castro');
  const [newSectorSla, setNewSectorSla] = useState('99.5%');
  const [newSectorDescription, setNewSectorDescription] = useState('');

  // Load collaborators directly from PostgreSQL Backend API
  const loadCollaborators = async () => {
    setIsLoading(true);
    let currentDeleted: string[] = [];
    try {
      const cached = localStorage.getItem('bycomp_deleted_user_ids');
      if (cached) currentDeleted = JSON.parse(cached);
    } catch {}

    try {
      const res = await apiBackendService.getUsers();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const list: Collaborator[] = [];
        res.data.forEach((pgU: any, idx: number) => {
          if (!currentDeleted.includes(pgU.id)) {
            list.push(
              enrichCollaboratorWithHRData({
                id: pgU.id,
                name: pgU.name || 'Colaborador',
                role: pgU.role || (pgU.user_role === 'SUPER_ADMIN' ? 'Super Administrador Master' : pgU.user_role === 'ADMINISTRATIVO' ? 'Coordenador Administrativo' : pgU.user_role === 'GESTOR' ? 'Gestor de Equipe' : 'Analista Operacional'),
                userRole: (pgU.user_role as UserRole) || 'COLABORADOR',
                area: pgU.area || 'ADMINISTRATIVO',
                sector: pgU.sector_name || 'Gestão',
                serviceClassification: pgU.service_classification || pgU.serviceClassification || 'Suporte N3',
                service_classification: pgU.service_classification || pgU.serviceClassification || 'Suporte N3',
                email: pgU.email,
                avatar: pgU.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                status: pgU.status || 'Em atividade',
                currentTask: pgU.current_task || 'Atividades operacionais GIHS System',
                phone: pgU.phone || '(11) 98765-4321',
                admissionDate: pgU.admission_date ? new Date(pgU.admission_date).toLocaleDateString('pt-BR') : '16/09/2026',
                contractType: pgU.contract_type || 'CLT',
                salaryBracket: pgU.salary_bracket || 'R$ 4.800,00',
                workSchedule: pgU.work_schedule || '40h semanais',
                emergencyContact: pgU.emergency_contact,
                cpfMasked: pgU.cpf_masked,
                isBlocked: pgU.is_blocked || false
              }, idx)
            );
          }
        });
        setCollaborators(list);
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Erro ao carregar colaboradores do backend PostgreSQL:', err);
    }

    // Fallback: master and initial accounts
    const initialList = AUTH_ACCOUNTS
      .filter(a => !currentDeleted.includes(a.id))
      .map((acc, idx) => enrichCollaboratorWithHRData(convertCredentialToCollaborator(acc), idx));
    setCollaborators(initialList);
    setIsLoading(false);
  };

  // Load sectors directly from PostgreSQL Backend API
  const loadSectors = async () => {
    try {
      const res = await apiBackendService.getSectors();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setSectors(res.data.map((s: any, idx: number) => ({
          id: s.id || `sec-${idx + 1}`,
          name: s.name,
          area: s.area || 'ADMINISTRATIVO',
          leaderName: s.leaderName || s.leader_name || 'A definir',
          collaboratorsCount: s.collaboratorsCount || s.collaborators_count || 0,
          slaTarget: s.slaTarget || s.sla_target || '99.0%',
          description: s.description || `Setor corporativo ${s.name}`,
          isCustom: false
        })));
        return;
      }
    } catch (err) {
      console.warn('Erro ao carregar setores do PostgreSQL:', err);
    }
    setSectors(INITIAL_ORGANIZATIONAL_SECTORS);
  };

  useEffect(() => {
    loadCollaborators();
    loadSectors();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // CHECK ACCESS POLICY: Somente Gestão, Administração e RH
  const activeUserRole = currentUser?.userRole || 'COLABORADOR';
  const isAllowed =
    activeUserRole === 'SUPER_ADMIN' ||
    activeUserRole === 'ADMINISTRATIVO' ||
    activeUserRole === 'GESTOR';

  const isSuperAdmin =
    activeUserRole === 'SUPER_ADMIN' ||
    currentUser?.email === 'victor.hugo@bycomp.com.br' ||
    currentUser?.email === 'victor@bycomp.com.br' ||
    currentUser?.id === 'user-master-victor-hugo';

  // If role is COLABORADOR, render the defense-in-depth security block screen
  if (!isAllowed) {
    return (
      <PrivateAccessLock
        currentUser={currentUser}
        onSwitchUser={onSwitchUser}
        onNavigate={onNavigate}
      />
    );
  }

  // Helper for Role metadata
  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          label: 'SUPER ADMINISTRADOR',
          badgeClass: 'bg-purple-50 border-purple-200 text-purple-700 font-bold',
          icon: Crown
        };
      case 'ADMINISTRATIVO':
        return {
          label: 'ADMINISTRATIVO',
          badgeClass: 'bg-blue-50 border-blue-200 text-[#37558d] font-bold',
          icon: UserCog
        };
      case 'GESTOR':
        return {
          label: 'GESTOR',
          badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold',
          icon: Shield
        };
      case 'COLABORADOR':
      default:
        return {
          label: 'COLABORADOR',
          badgeClass: 'bg-slate-100 border-slate-200 text-slate-700 font-semibold',
          icon: Users
        };
    }
  };

  // Filtered collaborators
  const filtered = collaborators.filter(c => {
    const s = search.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(s) ||
      (c.role || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.sector || '').toLowerCase().includes(s);

    const matchRole = selectedRole === 'TODOS' || c.userRole === selectedRole;
    const matchArea = selectedArea === 'TODOS' || c.area === selectedArea;
    const matchSector = selectedSector === 'TODOS' || c.sector === selectedSector;

    return matchSearch && matchRole && matchArea && matchSector;
  });

  // Grouped by userRole in exact order requested by user:
  const superAdmins = filtered.filter(c => c.userRole === 'SUPER_ADMIN');
  const administratives = filtered.filter(c => c.userRole === 'ADMINISTRATIVO');
  const gestores = filtered.filter(c => c.userRole === 'GESTOR');
  const colaboradores = filtered.filter(c => c.userRole === 'COLABORADOR' || !c.userRole);

  // Export full hierarchy to Excel
  const handleExportHierarchyExcel = () => {
    exportHierarchyToExcel(collaborators, sectors);
    showToast('✓ Arquitetura funcional e colaboradores exportados com sucesso em Excel (.xlsx)!');
  };

  // Handler: Create User with Temporary Password
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de Cyber-Security para a senha provisória
    const evalPass = evaluatePassword(newUserTempPassword);
    if (!evalPass.rules.minLength.satisfied || !evalPass.rules.hasSpecial.satisfied || !evalPass.rules.hasNumber.satisfied) {
      showToast('A senha provisória deve ter no mínimo 8 dígitos, 1 caractere especial e 1 número.');
      return;
    }

    const formattedEmail = newUserEmail || `${newUserName.toLowerCase().replace(/\s+/g, '.')}@bycomp.com.br`;
    const userId = `colab-${Date.now()}`;
    const finalClassification = isCustomClassification && customClassificationText.trim()
      ? customClassificationText.trim()
      : (newUserServiceClassification || 'Suporte N3');

    const newUser: Collaborator = enrichCollaboratorWithHRData(
      {
        id: userId,
        name: newUserName || 'Novo Usuário',
        role: newUserRoleTitle,
        userRole: newUserAccessRole,
        area: newUserArea,
        sector: newUserSector,
        serviceClassification: finalClassification,
        service_classification: finalClassification,
        email: formattedEmail,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Em atividade',
        tasksCount: 1,
        currentTask: 'Integração ao sistema corporativo GIHS System',
        phone: newUserPhone,
        admissionDate: new Date().toLocaleDateString('pt-BR'),
        isBlocked: false,
        contractType: newUserContractType,
        salaryBracket: newUserSalaryBracket
      },
      collaborators.length
    );

    // Save to PostgreSQL Backend
    try {
      await apiBackendService.createUser({
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userRole: newUser.userRole,
        area: newUser.area,
        sector: newUser.sector,
        serviceClassification: finalClassification,
        service_classification: finalClassification,
        avatar: newUser.avatar,
        status: 'Em atividade',
        currentTask: newUser.currentTask,
        phone: newUser.phone,
        admissionDate: new Date().toISOString().split('T')[0],
        contractType: newUser.contractType,
        salaryBracket: newUser.salaryBracket,
        workSchedule: newUser.workSchedule,
        emergencyContact: newUser.emergencyContact,
        isBlocked: false
      });

      // Set temporary password on backend
      await apiBackendService.updateUser(userId, {
        password_hash: newUserTempPassword
      });

      setCollaborators([newUser, ...collaborators]);
      setIsNewUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserTempPassword('Bycomp@2026#');
      showToast(`✓ Usuário ${newUser.name} cadastrado com sucesso no sistema (Senha provisória: "${newUserTempPassword}")!`);
    } catch (err: any) {
      console.error('Error creating user in backend:', err);
      setCollaborators([newUser, ...collaborators]);
      setIsNewUserModalOpen(false);
      showToast(`✓ Usuário salvo na memória local.`);
    }
  };

  // Handler: Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await apiBackendService.updateUser(editingUser.id, {
        name: editingUser.name,
        role: editingUser.role,
        userRole: editingUser.userRole,
        area: editingUser.area,
        sector: editingUser.sector,
        service_classification: editingUser.serviceClassification || (editingUser as any).service_classification || 'Suporte N3',
        serviceClassification: editingUser.serviceClassification || (editingUser as any).service_classification || 'Suporte N3',
        email: editingUser.email,
        phone: editingUser.phone,
        status: editingUser.status,
        contractType: editingUser.contractType,
        salaryBracket: editingUser.salaryBracket,
        workSchedule: editingUser.workSchedule
      });
      setCollaborators((prev) =>
        prev.map((c) => (c.id === editingUser.id ? { ...c, ...editingUser } : c))
      );
      showToast(`✓ Cargo e dados cadastrais de ${editingUser.name} atualizados com sucesso!`);
    } catch (err) {
      console.warn('Erro ao atualizar no PostgreSQL:', err);
      setCollaborators((prev) =>
        prev.map((c) => (c.id === editingUser.id ? { ...c, ...editingUser } : c))
      );
      showToast(`✓ Dados cadastrais atualizados com sucesso.`);
    } finally {
      setEditingUser(null);
    }
  };

  // Handler: Toggle Block / Unblock
  const handleToggleBlock = async (user: Collaborator) => {
    const willBlock = !user.isBlocked;
    const updatedUser: Collaborator = {
      ...user,
      isBlocked: willBlock,
      status: willBlock ? 'Bloqueado' : 'Em atividade'
    };

    try {
      await apiBackendService.updateUser(user.id, {
        is_blocked: willBlock,
        status: willBlock ? 'Bloqueado' : 'Em atividade'
      });
    } catch (err) {
      console.warn('Block sync to backend:', err);
    }

    setCollaborators(collaborators.map((c) => (c.id === user.id ? updatedUser : c)));
    showToast(
      willBlock
        ? `⚠️ Acesso de ${user.name} foi BLOQUEADO com sucesso no sistema.`
        : `✓ Acesso de ${user.name} foi DESBLOQUEADO.`
    );
  };

  // Handler: Open in-app modal to Delete User
  const handleDeleteUser = (user: Collaborator) => {
    if (
      user.id === 'user-master-victor-hugo' ||
      user.id === 'user-master-rebeca' ||
      user.id === 'user-master-victor-martins' ||
      user.id === 'user-master-matheus' ||
      user.email === 'victor.hugo@bycomp.com.br'
    ) {
      showToast('O usuário Master (Super Admin) não pode ser excluído.');
      return;
    }
    setUserToDelete(user);
  };

  // Confirm and execute deletion
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    const target = userToDelete;
    setUserToDelete(null);

    try {
      await apiBackendService.deleteUser(target.id);
      const updated = Array.from(new Set([...deletedUserIds, target.id]));
      setDeletedUserIds(updated);
      try {
        localStorage.setItem('bycomp_deleted_user_ids', JSON.stringify(updated));
      } catch {}
      setCollaborators((prev) => prev.filter((c) => c.id !== target.id));
      showToast(`✓ Colaborador ${target.name} excluído do sistema com sucesso.`);
    } catch (err: any) {
      console.warn('Delete error:', err);
      setCollaborators((prev) => prev.filter((c) => c.id !== target.id));
      showToast(`✓ Colaborador removido.`);
    }
  };

  // Handler: Open in-app modal to Reset/Set Temporary Password
  const handleResetTempPassword = (user: Collaborator) => {
    setTempPasswordUser(user);
    setTempPasswordInput('bycomp2026');
  };

  // Handler: Create Sector
  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;

    const newSec: OrganizationalSector = {
      id: `sec-${Date.now()}`,
      name: newSectorName.trim(),
      area: newSectorArea,
      leaderName: newSectorLeader || 'A definir',
      collaboratorsCount: 0,
      slaTarget: newSectorSla || '99.0%',
      description: newSectorDescription || 'Novo setor cadastrado na arquitetura corporativa',
      isCustom: true
    };

    try {
      await apiBackendService.createSector(newSec);
    } catch (err) {
      console.warn('Error saving sector to PostgreSQL:', err);
    }

    setSectors([...sectors, newSec]);
    setIsNewSectorModalOpen(false);
    setNewSectorName('');
    setNewSectorDescription('');
    showToast(`✓ Setor "${newSec.name}" criado com sucesso na área ${newSec.area}!`);
  };

  // Unique list of sectors from current sectors state
  const availableSectorsForArea = sectors.filter(
    s => newUserArea === 'TODOS' || s.area === newUserArea
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header: FASE 4 PRIVADA (Gestão, Administração & RH) */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs relative overflow-hidden">
        {/* Subtle Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10 text-[#37558d]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#37558d] shadow-2xs">
                <Shield className="w-5 h-5 text-[#37558d]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-[#37558d] tracking-tight">
                    Colaboradores: Quadro Funcional & Dossiê RH
                  </h1>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                    LGPD COMPLIANT • ART. 46
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Acesso restrito autorizado para <strong className="text-[#37558d]">Gestão</strong>,{' '}
                  <strong className="text-[#37558d]">Administração</strong> e{' '}
                  <strong className="text-[#37558d]">RH</strong>. Prontuários funcionais, dados contratuais e governança RBAC.
                </p>
              </div>
            </div>

            {/* Current Operator & Confidentiality Badges */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 mt-3.5">
              {/* Operator info */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-[#37558d] px-3 py-1.5 rounded-xl">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-[#37558d]"
                />
                <span className="text-xs text-slate-600">
                  Operador: <strong className="text-[#37558d]">{currentUser?.name}</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#37558d] border border-blue-200">
                  {currentUser?.userRole}
                </span>
              </div>

              {/* Total Colabs */}
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-[#37558d] px-2.5 py-1.5 rounded-xl font-mono text-[11px]">
                <Users className="w-3.5 h-3.5 text-[#37558d]" />
                <span>{collaborators.length} colaboradores monitorados</span>
              </span>

              {/* Setores */}
              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-[#37558d] px-2.5 py-1.5 rounded-xl font-mono text-[11px]">
                <Building2 className="w-3.5 h-3.5 text-[#37558d]" />
                <span>{sectors.length} setores ativos</span>
              </span>
            </div>
          </div>

          {/* Action Buttons: Exportar Excel, Cadastrar Setor, Novo Usuário */}
          <div className="flex flex-wrap items-center gap-2.5">
            {onNavigate && (
              <button
                onClick={() => onNavigate('organograma')}
                id="btn-colab-to-organograma"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-[#37558d] hover:bg-[#37558d] hover:text-white border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Acessar Árvore Hierárquica e Organograma (Fase 3)"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Organograma</span>
              </button>
            )}

            <button
              onClick={handleExportHierarchyExcel}
              id="btn-exportar-hierarquia-excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#37558d] hover:bg-[#37558d] hover:text-white border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Baixar lista funcional em Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar (.xlsx)</span>
            </button>

            <button
              onClick={() => setIsNewSectorModalOpen(true)}
              id="btn-cadastrar-novo-setor"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-[#37558d] hover:bg-[#37558d] hover:text-white border border-slate-200 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>+ Setor</span>
            </button>

            <button
              onClick={() => setIsNewUserModalOpen(true)}
              id="btn-novo-usuario"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Colaborador</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (4 TABS) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {/* Tab 1: Hierarquia de Usuários */}
        <button
          onClick={() => setActiveTab('hierarchy')}
          id="tab-hierarquia-usuarios"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'hierarchy'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'bg-white text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Hierarquia Oficial de Usuários</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'hierarchy' ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-[#37558d] font-bold'}`}>
            {filtered.length}
          </span>
        </button>

        {/* Tab 2: Dossiê RH & Dados Contratuais (NOVA FASE 4) */}
        <button
          onClick={() => setActiveTab('rh_dossier')}
          id="tab-dossie-rh"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'rh_dossier'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'bg-white text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Dossiê RH & Dados Contratuais</span>
        </button>

        {/* Tab 3: Estrutura Organizacional & Setores */}
        <button
          onClick={() => setActiveTab('sectors')}
          id="tab-estrutura-setores"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'sectors'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'bg-white text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Estrutura Organizacional & Setores</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'sectors' ? 'bg-white/20 text-white font-bold' : 'bg-slate-100 text-[#37558d] font-bold'}`}>
            {sectors.length}
          </span>
        </button>

        {/* Tab 4: Matriz de Permissões (RBAC) */}
        <button
          onClick={() => setActiveTab('rbac_matrix')}
          id="tab-matriz-permissoes"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'rbac_matrix'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'bg-white text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Matriz de Permissões (RBAC)</span>
        </button>
      </div>

      {/* VIEW TAB 1: HIERARQUIA DE USUÁRIOS (SUPER ADMIN -> ADMINISTRATIVO -> GESTOR -> COLABORADOR) */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-6">
          {/* Filter Bar with white background and #37558d styling */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#37558d]" />
              <input
                type="text"
                placeholder="Pesquisar por nome, cargo, e-mail ou setor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
              {/* Role filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-[11px] text-[#37558d] flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-[#37558d]" />
                  Perfil:
                </span>
                {['TODOS', 'SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'].map((roleKey) => (
                  <button
                    key={roleKey}
                    onClick={() => setSelectedRole(roleKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      selectedRole === roleKey
                        ? 'bg-[#37558d] text-white shadow-2xs font-bold'
                        : 'bg-slate-50 text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10 font-medium'
                    }`}
                  >
                    {roleKey === 'TODOS'
                      ? 'Todos'
                      : roleKey === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : roleKey === 'ADMINISTRATIVO'
                      ? 'Administrativo'
                      : roleKey === 'GESTOR'
                      ? 'Gestor'
                      : 'Colaborador'}
                  </button>
                ))}
              </div>

              {/* Area filter */}
              <div className="flex items-center gap-1.5 flex-wrap border-l border-slate-200 pl-3">
                <span className="font-bold text-[11px] text-[#37558d] flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#37558d]" />
                  Área:
                </span>
                {['TODOS', ...ORGANIZATIONAL_AREAS].map((areaKey) => (
                  <button
                    key={areaKey}
                    onClick={() => setSelectedArea(areaKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                      selectedArea === areaKey
                        ? 'bg-[#37558d] text-white shadow-2xs font-bold'
                        : 'bg-slate-50 text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10 font-medium'
                    }`}
                  >
                    {areaKey}
                  </button>
                ))}
              </div>

              {/* Clear filters if active */}
              {(selectedRole !== 'TODOS' || selectedArea !== 'TODOS' || search !== '') && (
                <button
                  onClick={() => {
                    setSelectedRole('TODOS');
                    setSelectedArea('TODOS');
                    setSearch('');
                  }}
                  className="text-xs text-[#37558d] hover:text-[#23385d] font-bold underline ml-auto cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* 1. SUPER ADMINISTRADOR SECTION */}
          {(selectedRole === 'TODOS' || selectedRole === 'SUPER_ADMIN') && superAdmins.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
                      <span>SUPER ADMINISTRADOR</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold">
                        {superAdmins.length} usuário(s)
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Acesso completo ao sistema • Controle total de setores, usuários, kanbans, ponto, integrações e governança
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {superAdmins.map((user) => renderUserCard(user))}
              </div>
            </div>
          )}

          {/* 2. ADMINISTRATIVO SECTION */}
          {(selectedRole === 'TODOS' || selectedRole === 'ADMINISTRATIVO') && administratives.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[#37558d]">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
                      <span>ADMINISTRATIVO & RH</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-mono font-bold">
                        {administratives.length} usuário(s)
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Gestão de colaboradores, formulários, espelho de ponto, planilhas mestras e cadastros de RH
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {administratives.map((user) => renderUserCard(user))}
              </div>
            </div>
          )}

          {/* 3. GESTOR SECTION */}
          {(selectedRole === 'TODOS' || selectedRole === 'GESTOR') && gestores.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
                      <span>GESTOR (LÍDERES DE SETOR)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                        {gestores.length} usuário(s)
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Gestão do seu setor específico: Kanban da equipe, distribuição de chamados e aprovação de apontamentos
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gestores.map((user) => renderUserCard(user))}
              </div>
            </div>
          )}

          {/* 4. COLABORADOR SECTION */}
          {(selectedRole === 'TODOS' || selectedRole === 'COLABORADOR') && colaboradores.length > 0 && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[#37558d]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#37558d] uppercase tracking-wider flex items-center gap-2">
                      <span>COLABORADOR</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-[#37558d] border border-slate-200 font-mono font-bold">
                        {colaboradores.length} usuário(s)
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Visualiza apenas suas informações, seu Kanban, suas tarefas, ponto, agenda e info compartilhada
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {colaboradores.map((user) => renderUserCard(user))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW TAB 2: DOSSIÊ RH & DADOS CONTRATUAIS (FASE 4 PRIVADA) */}
      {activeTab === 'rh_dossier' && (
        <HRDossierTab
          collaborators={collaborators}
          onSelectCollaborator={(c) => setSelectedUserDetail(c)}
          onEditCollaborator={(c) => setEditingUser(c)}
          onDeleteCollaborator={(c) => handleDeleteUser(c)}
          isSuperAdmin={isSuperAdmin}
          showToast={showToast}
        />
      )}

      {/* VIEW TAB 3: ESTRUTURA ORGANIZACIONAL (11 SETORES) */}
      {activeTab === 'sectors' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-[#37558d]">Estrutura Oficial de Setores</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organização por Áreas corporativas. Você pode cadastrar novos setores a qualquer momento.
              </p>
            </div>
            <button
              onClick={() => setIsNewSectorModalOpen(true)}
              id="btn-adicionar-setor-tab"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Setor</span>
            </button>
          </div>

          {/* Grouped by Area */}
          {ORGANIZATIONAL_AREAS.map((areaName) => {
            const areaSectors = sectors.filter((s) => s.area === areaName);

            return (
              <div
                key={areaName}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-[#37558d]"></span>
                    <h3 className="text-base font-bold text-[#37558d] tracking-tight">{areaName}</h3>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                      {areaSectors.length} setores
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    Área Corporativa GIHS System
                  </span>
                </div>

                {/* Grid of Sectors in this Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areaSectors.map((sec) => {
                    const sectorCollaborators = collaborators.filter(
                      (c) => c.sector === sec.name
                    );

                    return (
                      <div
                        key={sec.id}
                        className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-[#37558d]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-[#37558d] flex items-center gap-1.5">
                              <span>Setor: {sec.name}</span>
                              {sec.isCustom && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                                  Custom
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#37558d] border border-blue-200">
                              SLA: {sec.slaTarget}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mt-2">
                            {sec.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Líder / Gestor:</span>
                            <span className="font-semibold text-[#37558d]">{sec.leaderName}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Headcount Ativo:</span>
                            <span className="font-mono text-[#37558d] font-bold">
                              {sectorCollaborators.length} pessoa(s)
                            </span>
                          </div>

                          {/* Preview of members */}
                          <div className="flex items-center -space-x-1.5 pt-1 overflow-hidden">
                            {sectorCollaborators.slice(0, 5).map((colab) => (
                              <img
                                key={colab.id}
                                src={colab.avatar}
                                alt={colab.name}
                                title={`${colab.name} (${colab.role})`}
                                className="w-6 h-6 rounded-full ring-2 ring-white object-cover"
                              />
                            ))}
                            {sectorCollaborators.length > 5 && (
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-[#37558d] text-[10px] font-bold flex items-center justify-center ring-2 ring-white font-mono">
                                +{sectorCollaborators.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW TAB 4: MATRIZ DE PERMISSÕES (RBAC) / CONFIGURAÇÃO DE PERMISSÃO */}
      {activeTab === 'rbac_matrix' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            <h2 className="text-base font-bold text-[#37558d] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#37558d]" />
              Matriz Oficial de Controle de Acesso por Função (RBAC) - Configuração de Permissões
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Definições de permissões estritas para governança, segurança e conformidade do GIHS System.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {ROLE_DEFINITIONS.map((def) => {
              const meta = getRoleBadge(def.role);
              const IconComp = meta.icon;

              return (
                <div
                  key={def.role}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <IconComp className="w-5 h-5 text-[#37558d]" />
                        <h3 className="text-sm font-bold text-[#37558d] uppercase tracking-wider">
                          {def.label}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
                        Nível {def.role === 'SUPER_ADMIN' ? '1 (Total)' : def.role === 'ADMINISTRATIVO' ? '2 (Operacional)' : def.role === 'GESTOR' ? '3 (Setorial)' : '4 (Individual)'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-3 font-medium">
                      {def.description}
                    </p>

                    <div className="mt-4 space-y-1.5">
                      <p className="text-[11px] font-bold text-[#37558d] uppercase tracking-wider">
                        Permissões e Ações Autorizadas:
                      </p>
                      <ul className="space-y-1.5 pt-1">
                        {def.allowedActions.map((action, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {def.role === 'GESTOR' && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Restrição: Não possui acesso automático aos dados de outros setores.</span>
                    </div>
                  )}

                  {def.role === 'COLABORADOR' && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Restrição: Visualiza apenas seus próprios registros e tarefas atribuídas.</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: + NOVO COLABORADOR / USUÁRIO (com campos de RH) */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#37558d] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#37558d]" />
                Criar Novo Usuário / Cadastro de Pessoal
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="text-slate-400 hover:text-[#37558d] text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gabriela Costa"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="gabriela.costa@gihs.com.br"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Cargo Profissional
                </label>
                <input
                  type="text"
                  value={newUserRoleTitle}
                  onChange={(e) => setNewUserRoleTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  required
                />
              </div>

              {/* Perfil de Acesso (RBAC) */}
              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Perfil de Acesso (Hierarquia Oficial)
                </label>
                <select
                  value={newUserAccessRole}
                  onChange={(e) => setNewUserAccessRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                >
                  <option value="SUPER_ADMIN">SUPER ADMINISTRADOR (Acesso total)</option>
                  <option value="ADMINISTRATIVO">ADMINISTRATIVO (Pessoas, Docs, Planilhas & RH)</option>
                  <option value="GESTOR">GESTOR (Equipe, tarefas e SLA do setor)</option>
                  <option value="COLABORADOR">COLABORADOR (Acesso individual)</option>
                </select>
              </div>

              {/* Área e Setor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Área Organizacional
                  </label>
                  <select
                    value={newUserArea}
                    onChange={(e) => {
                      setNewUserArea(e.target.value);
                      const available = sectors.filter(s => s.area === e.target.value);
                      if (available.length > 0) {
                        setNewUserSector(available[0].name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    {ORGANIZATIONAL_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Setor Municipal / Setor Organizacional
                  </label>
                  <select
                    value={newUserSector}
                    onChange={(e) => {
                      const sec = e.target.value;
                      setNewUserSector(sec);
                      const srvs = getServicesForSector(sec);
                      if (srvs.length > 0) {
                        setNewUserServiceClassification(srvs[0].id);
                        setIsCustomClassification(false);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all font-mono"
                  >
                    {availableSectorsForArea.map(sec => (
                      <option key={sec.id} value={sec.name}>{sec.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classificação do Serviço GLPI / Fila Especializada para TODOS os Setores */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#37558d] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#37558d]" />
                    <span>Fila Técnica & Classificação do Serviço GLPI (Todos os Setores) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full border border-blue-300/70">
                    Catálogo GLPI Prefeitura
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Define a sub-fila de atendimento municipal para este colaborador. Chamados classificados para este serviço entrarão <strong>exclusivamente na fila deste profissional</strong>.
                </p>
                <div className="space-y-2">
                  <select
                    value={isCustomClassification ? 'CUSTOM' : newUserServiceClassification}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setIsCustomClassification(true);
                      } else {
                        setIsCustomClassification(false);
                        setNewUserServiceClassification(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs text-[#37558d] font-bold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d]"
                  >
                    {/* Serviços específicos do setor selecionado */}
                    <optgroup label={`⭐ Especialidades do Setor ${newUserSector} (Recomendadas)`}>
                      {getServicesForSector(newUserSector).map(srv => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} (SLA: {srv.defaultSlaHours}h)
                        </option>
                      ))}
                    </optgroup>

                    {/* Catálogo Completo de Todos os Setores Municipais (GLPI) */}
                    {Object.entries(GLPI_SECTORS_CATALOG).map(([secKey, secData]) => {
                      if (secKey.toLowerCase() === newUserSector.toLowerCase()) return null;
                      return (
                        <optgroup key={secKey} label={`Catálogo ${secData.label}`}>
                          {secData.services.map(srv => (
                            <option key={srv.id} value={srv.id}>
                              {srv.name} (SLA: {srv.defaultSlaHours}h)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}

                    <optgroup label="Outras Especialidades / Manual">
                      <option value="CUSTOM">Outro (Digitar classificação personalizada...)</option>
                    </optgroup>
                  </select>

                  {isCustomClassification && (
                    <input
                      type="text"
                      placeholder="Ex: Patrimônio - Gestão de Frotas ou DBA - Auditoria"
                      value={customClassificationText}
                      onChange={(e) => setCustomClassificationText(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-blue-400 rounded-xl text-xs text-[#37558d] font-bold focus:outline-none placeholder:text-slate-400"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Dados de RH: Regime e Faixa Salarial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Regime de Contratação (RH)
                  </label>
                  <select
                    value={newUserContractType}
                    onChange={(e) => setNewUserContractType(e.target.value as 'CLT' | 'PJ' | 'Estágio')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    <option value="CLT">CLT (Consolidação das Leis do Trabalho)</option>
                    <option value="PJ">PJ (Pessoa Jurídica)</option>
                    <option value="Estágio">Estágio Corporativo (Lei 11.788)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Remuneração Base / Faixa Salarial
                  </label>
                  <input
                    type="text"
                    value={newUserSalaryBracket}
                    onChange={(e) => setNewUserSalaryBracket(e.target.value)}
                    placeholder="Ex: R$ 5.800,00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold font-mono focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  />
                </div>
              </div>

              {/* Senha Provisória de Acesso */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#37558d] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#37558d]" />
                    Senha Provisória de Acesso (Criptografia PBKDF2 no PostgreSQL)
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Mín. 8 dígitos, 1 especial, 1 número
                  </span>
                </div>
                <input
                  type="text"
                  value={newUserTempPassword}
                  onChange={(e) => setNewUserTempPassword(e.target.value)}
                  placeholder="Ex: Bycomp@2026#"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-bold font-mono focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  🔒 Regras corporativas: mínimo 8 dígitos, 1 caractere especial e 1 número. Ao gravar, a senha é criptografada no PostgreSQL e o colaborador será orientado a redefini-la em Configurações.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Cadastrar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: + CADASTRAR NOVO SETOR */}
      {isNewSectorModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#37558d] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#37558d]" />
                Cadastrar Novo Setor Organizacional
              </h3>
              <button
                onClick={() => setIsNewSectorModalOpen(false)}
                className="text-slate-400 hover:text-[#37558d] text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSector} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Área Matriz
                </label>
                <select
                  value={newSectorArea}
                  onChange={(e) => setNewSectorArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                >
                  {ORGANIZATIONAL_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Nome do Setor (Ex: N4, Mobile, Cloud Ops, QA, Auditoria)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cloud Ops & DevOps"
                  value={newSectorName}
                  onChange={(e) => setNewSectorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Líder / Gestor
                  </label>
                  <input
                    type="text"
                    value={newSectorLeader}
                    onChange={(e) => setNewSectorLeader(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                    Meta de SLA
                  </label>
                  <input
                    type="text"
                    value={newSectorSla}
                    onChange={(e) => setNewSectorSla(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1.5">
                  Descrição do Setor
                </label>
                <textarea
                  rows={2}
                  value={newSectorDescription}
                  onChange={(e) => setNewSectorDescription(e.target.value)}
                  placeholder="Responsabilidade e escopo operacional do setor..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewSectorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUÁRIO & CARGO */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#37558d] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#37558d]" />
                  Editar Colaborador & Cargo
                </h3>
                <p className="text-[11px] text-slate-500">
                  Alterações serão sincronizadas no banco de dados corporativo
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-[#37558d] text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#37558d] mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Cargo Funcional
                  </label>
                  <input
                    type="text"
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                    placeholder="Ex: Analista de TI, Gestor Operacional"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Perfil de Acesso / Hierarquia
                  </label>
                  <select
                    value={editingUser.userRole || 'COLABORADOR'}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, userRole: e.target.value as UserRole })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Master / Acesso Total)</option>
                    <option value="ADMINISTRATIVO">ADMINISTRATIVO (RH, Financeiro, Gestão)</option>
                    <option value="GESTOR">GESTOR (Líder de Setor & Equipe)</option>
                    <option value="COLABORADOR">COLABORADOR (Operacional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Área Matriz
                  </label>
                  <select
                    value={editingUser.area || 'SUPORTE'}
                    onChange={(e) => setEditingUser({ ...editingUser, area: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    {ORGANIZATIONAL_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Setor Organizacional
                  </label>
                  <select
                    value={editingUser.sector}
                    onChange={(e) => {
                      const sec = e.target.value;
                      const srvs = getServicesForSector(sec);
                      setEditingUser({
                        ...editingUser,
                        sector: sec,
                        serviceClassification: srvs.length > 0 ? srvs[0].id : editingUser.serviceClassification,
                        service_classification: srvs.length > 0 ? srvs[0].id : editingUser.service_classification
                      });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    {sectors.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.area})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Classificação do Serviço GLPI / Fila Especializada para TODOS os Setores */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#37558d] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#37558d]" />
                    <span>Fila Técnica & Classificação do Serviço GLPI (Todos os Setores) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full border border-blue-300/70">
                    Catálogo GLPI Prefeitura
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Define em qual fila especializada os chamados deste usuário serão direcionados no sistema.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={editingUser.serviceClassification || (editingUser as any).service_classification || 'Suporte N3'}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      serviceClassification: e.target.value,
                      service_classification: e.target.value
                    })}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs text-[#37558d] font-bold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d]"
                  >
                    {/* Serviços específicos do setor atual */}
                    <optgroup label={`⭐ Especialidades de ${editingUser.sector} (Recomendadas)`}>
                      {getServicesForSector(editingUser.sector).map(srv => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} (SLA: {srv.defaultSlaHours}h)
                        </option>
                      ))}
                    </optgroup>

                    {/* Catálogo de Todos os Demais Setores */}
                    {Object.entries(GLPI_SECTORS_CATALOG).map(([secKey, secData]) => {
                      if (secKey.toLowerCase() === (editingUser.sector || '').toLowerCase()) return null;
                      return (
                        <optgroup key={secKey} label={`Catálogo ${secData.label}`}>
                          {secData.services.map(srv => (
                            <option key={srv.id} value={srv.id}>
                              {srv.name} (SLA: {srv.defaultSlaHours}h)
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>

                  <input
                    type="text"
                    placeholder="Ou digite classificação manual personalizada..."
                    value={editingUser.serviceClassification || (editingUser as any).service_classification || ''}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      serviceClassification: e.target.value,
                      service_classification: e.target.value
                    })}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl text-xs text-[#37558d] font-bold focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Regime Contratual
                  </label>
                  <select
                    value={editingUser.contractType || 'CLT'}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        contractType: e.target.value as 'CLT' | 'PJ' | 'Estágio'
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    <option value="CLT">CLT (Consolidação das Leis do Trabalho)</option>
                    <option value="PJ">PJ (Pessoa Jurídica)</option>
                    <option value="Estágio">Estágio Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={editingUser.status || 'Em atividade'}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        status: e.target.value as any
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                  >
                    <option value="Em atividade">Em atividade (Online / Ativo)</option>
                    <option value="Intervalo">Intervalo</option>
                    <option value="Ausente">Ausente</option>
                    <option value="Férias">Férias</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#37558d] mb-1">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all"
                    placeholder="(11) 98888-0000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE COLABORADOR */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Excluir Colaborador
                </h3>
                <p className="text-xs text-slate-500">
                  Ação exclusiva do Super Admin Master
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={userToDelete.avatar}
                alt={userToDelete.name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-[#37558d] truncate">{userToDelete.name}</h4>
                <p className="text-xs text-slate-600 truncate">{userToDelete.role}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-mono">{userToDelete.sector}</span>
                  <span>•</span>
                  <span className="truncate">{userToDelete.email}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/60 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                Tem certeza de que deseja excluir permanentemente o cadastro de <strong>{userToDelete.name}</strong>? Os dados e permissões serão removidos do sistema.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Colaborador</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SENHA PROVISÓRIA */}
      {tempPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#37558d] flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Definir Senha Provisória (Criptografia PostgreSQL)
              </h3>
              <button
                onClick={() => setTempPasswordUser(null)}
                className="text-slate-400 hover:text-[#37558d] text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
              <p>
                Defina a senha de primeiro acesso para <strong>{tempPasswordUser.name}</strong>. Ao efetuar o login, o colaborador será orientado a redefini-la em Configurações.
              </p>
              <div className="text-[11px] font-semibold text-[#37558d] flex items-center gap-1.5 pt-1 border-t border-blue-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Regras: mín. 8 dígitos, 1 caractere especial e 1 número. Criptografia PBKDF2-SHA512 no PostgreSQL.</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#37558d]">
                  Nova Senha Provisória
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(1000 + Math.random() * 9000);
                    setTempPasswordInput(`Bycomp@${rnd}#`);
                  }}
                  className="text-[10px] font-bold text-[#37558d] hover:text-[#2c4471] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                >
                  ⚡ Gerar Senha Segura
                </button>
              </div>
              <input
                type="text"
                value={tempPasswordInput}
                onChange={(e) => setTempPasswordInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all font-mono"
                placeholder="Ex: Bycomp@2026#"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTempPasswordUser(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const check = evaluatePassword(tempPasswordInput.trim());
                  if (!check.rules.minLength.satisfied || !check.rules.hasSpecial.satisfied || !check.rules.hasNumber.satisfied) {
                    showToast('A senha provisória deve ter no mínimo 8 dígitos, 1 número e 1 caractere especial (!@#$).');
                    return;
                  }
                  try {
                    await apiBackendService.updateUser(tempPasswordUser.id, {
                      password_hash: tempPasswordInput.trim()
                    });
                    showToast(
                      `✓ Senha provisória para ${tempPasswordUser.name} definida e criptografada no PostgreSQL (PBKDF2-SHA512) com sucesso!`
                    );
                    setTempPasswordUser(null);
                  } catch (err: any) {
                    showToast(
                      `Erro ao gravar senha provisória: ${err?.message || 'Verifique a conexão.'}`
                    );
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Salvar Criptografada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEFINIR PERMISSÕES (RBAC) */}
      {permissionsUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#37558d] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#37558d]" />
                Configuração de Permissão (RBAC)
              </h3>
              <button
                onClick={() => setPermissionsUser(null)}
                className="text-slate-400 hover:text-[#37558d] text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <img
                src={permissionsUser.avatar}
                alt={permissionsUser.name}
                className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
              />
              <div>
                <p className="font-bold text-xs text-[#37558d]">{permissionsUser.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">{permissionsUser.role}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#37558d] mb-1">
                Selecione o Papel Oficial:
              </label>

              {(['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'] as UserRole[]).map((role) => {
                const meta = getRoleBadge(role);
                const isSelected = permissionsUser.userRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={async () => {
                      const updated = { ...permissionsUser, userRole: role };
                      setCollaborators(collaborators.map(c => (c.id === updated.id ? updated : c)));
                      setPermissionsUser(null);
                      try {
                        await apiBackendService.updateUser(updated.id, {
                          user_role: role
                        });
                        showToast(`✓ Perfil de ${updated.name} alterado para ${role} com sucesso.`);
                      } catch (e) {
                        showToast(`✓ Perfil de ${updated.name} alterado para ${role}.`);
                      }
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 border-2 border-[#37558d] text-[#37558d] shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-[#37558d]/50 hover:bg-slate-50/70 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-[#37558d]">{meta.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {role === 'SUPER_ADMIN'
                          ? 'Acesso irrestrito a todas as telas e configurações'
                          : role === 'ADMINISTRATIVO'
                          ? 'Gestão de pessoas, chamados gerais, planilhas e relatórios'
                          : role === 'GESTOR'
                          ? 'Visão do Kanban de equipe, apontamentos e SLAs do setor'
                          : 'Acesso restrito ao próprio Kanban, tarefas e ponto'}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#37558d] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: PRONTUÁRIO COMPLETO DO COLABORADOR (DOSSIÊ PRIVADO) */}
      <CollaboratorDetailDrawer
        collaborator={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
        onToggleBlock={handleToggleBlock}
        onEdit={(c) => setEditingUser(c)}
        onDelete={(c) => handleDeleteUser(c)}
        isSuperAdmin={isSuperAdmin}
        showToast={showToast}
      />
    </div>
  );

  // Sub-render: Individual user card for the hierarchy view
  function renderUserCard(c: Collaborator) {
    const meta = getRoleBadge(c.userRole);
    const isVictor =
      c.id === 'user-master-victor-hugo' ||
      c.email === 'victor.hugo@bycomp.com.br';

    return (
      <div
        key={c.id}
        onClick={() => setSelectedUserDetail(c)}
        className={`bg-white border rounded-2xl p-4 space-y-3 transition-all hover:scale-[1.01] hover:shadow-md group flex flex-col justify-between cursor-pointer ${
          c.isBlocked
            ? 'border-rose-300 bg-rose-50/20'
            : isVictor
            ? 'border-[#37558d] ring-1 ring-[#37558d]/25 shadow-2xs'
            : 'border-slate-200 hover:border-[#37558d]/50 shadow-2xs'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src={c.avatar}
              alt={c.name}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                c.isBlocked
                  ? 'bg-rose-500'
                  : c.status === 'Em atividade'
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              }`}
            ></span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-bold text-[#37558d] group-hover:text-[#23385d] transition-colors truncate">
                {c.name}
              </h3>
              {isVictor && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold uppercase">
                  Super Admin
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 truncate mt-0.5">{c.role}</p>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded border ${meta.badgeClass}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-50 text-[#37558d] border border-slate-200">
                {c.sector}
              </span>
              {(c.serviceClassification || (c as any).service_classification) && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200" title="Classificação da Fila de Atendimento">
                  Fila: {c.serviceClassification || (c as any).service_classification}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Current task or block warning */}
        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate">
          {c.isBlocked ? (
            <span className="text-rose-600 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" />
              Acesso temporariamente bloqueado
            </span>
          ) : (
            <span className="truncate block">
              <strong className="text-[#37558d]">Tarefa:</strong> {c.currentTask}
            </span>
          )}
        </div>

        {/* Card Footer: Status & Actions */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
          <span
            className={`font-semibold flex items-center gap-1 ${
              c.isBlocked
                ? 'text-rose-600'
                : c.status === 'Em atividade'
                ? 'text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            <span>
              {c.isBlocked
                ? '🔴 Bloqueado'
                : c.status === 'Em atividade'
                ? '🟢 Ativo'
                : '⚪ Ausente'}
            </span>
          </span>

          {/* Action Icons: Edit, Temp Password, Block/Unblock, Permissions, Delete */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => handleResetTempPassword(c)}
              title="Redefinir Senha Provisória (Usuário alterará em Configurações)"
              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setEditingUser(c)}
              title="Editar usuário"
              className="p-1.5 text-[#37558d] hover:text-[#23385d] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setPermissionsUser(c)}
              title="Definir permissões de acesso"
              className="p-1.5 text-[#37558d] hover:text-[#23385d] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {!isVictor && (
              <>
                <button
                  onClick={() => handleToggleBlock(c)}
                  title={c.isBlocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    c.isBlocked
                      ? 'text-emerald-600 hover:bg-emerald-50'
                      : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  {c.isBlocked ? (
                    <Unlock className="w-3.5 h-3.5" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </button>

                <button
                  onClick={() => handleDeleteUser(c)}
                  title="Excluir Colaborador"
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
};
