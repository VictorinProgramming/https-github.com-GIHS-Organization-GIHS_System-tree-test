export type Sector = string;

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMINISTRATIVO'
  | 'GESTOR'
  | 'COLABORADOR';

export interface UserRolePermissions {
  role: UserRole;
  label: string;
  description: string;
  allowedActions: string[];
}

export interface OrganizationalSector {
  id: string;
  name: string;
  area: 'SUPORTE' | 'DESENVOLVIMENTO' | 'SEGURANÇA' | 'DADOS' | 'ADMINISTRATIVO' | string;
  leaderName?: string;
  collaboratorsCount: number;
  description?: string;
  slaTarget?: string;
  isCustom?: boolean;
}

export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente' | 'Crítica';

export type TaskStatus = 'BACKLOG' | 'A_FAZER' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDO';

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  userRole?: UserRole;
  area?: string;
  sector: Sector;
  email: string;
  avatar: string;
  status: 'Em atividade' | 'Intervalo' | 'Ausente' | 'Férias' | 'Bloqueado';
  currentTask: string;
  phone: string;
  admissionDate: string;
  tasksCount?: number;
  isBlocked?: boolean;
  is_blocked?: boolean;
  hierarchyLevel?: number;
  password?: string;
  password_hash?: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
  customPermissions?: string[];
  contractType?: 'CLT' | 'PJ' | 'Estágio';
  salaryBracket?: string;
  workSchedule?: string;
  asoStatus?: 'Em dia' | 'A renovar' | 'Pendente';
  benefits?: string[];
  cpfMasked?: string;
  emergencyContact?: string;
  avatar_url?: string;
  sector_name?: string;
  user_role?: string;
  facial_photo_url?: string;
  facial_active?: boolean;
  facial_biometric_hash?: string;
  facial_landmarks_count?: number;
  facial_confidence_score?: number;
  facial_registered_at?: string;
  facial_notes?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  sector: Sector;
  assigneeId?: string;
  assigneeName: string;
  assigneeAvatar?: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  tag: string;
  commentsCount: number;
  subtasks: { id: string; title: string; done: boolean }[];
  isDelayed?: boolean;
  reviewStatus?: 'NONE' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  leaderNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityRecord {
  id: string;
  date: string;
  time: string;
  collaborator: string;
  sector: Sector;
  activity: string;
  priority: Priority;
  status: 'Concluído' | 'Em andamento' | 'Pendente' | 'Em revisão';
  timeSpent: string;
  observation: string;
  attachment?: string;
}

export interface AttendanceRecord {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  sector: Sector;
  date: string;
  entry: string;
  breakStart: string;
  breakEnd: string;
  exit: string;
  totalHours: string;
  status: 'Normal' | 'Atraso' | 'Hora Extra' | 'Em expediente' | 'Intervalo';
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  date: string;
  sector: Sector;
  type: 'Reunião' | 'Alinhamento' | 'Plantão' | 'Entrega';
  attendees: string[];
  location: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  severity: 'Info' | 'Warning' | 'Critical';
  user: string;
  actionType: string;
  description: string;
  ip: string;
}

export interface ClientEntity {
  id: string;
  name: string;
  plan: string;
  sla: string;
  openTickets: number;
  monthlyValue: string;
  contact: string;
  status: string;
}

export interface TicketHistoryItem {
  timestamp: string;
  action: string;
  user: string;
  userSector?: string;
  details?: string;
}

export interface SupportTicket {
  id: string;
  protocol?: string;
  client: string;
  subject: string;
  title?: string;
  sector: Sector;
  assignedTo?: string;
  assignedAvatar?: string;
  priority: Priority;
  status: 'Aberto' | 'Em atendimento' | 'Aguardando' | 'Resolvido';
  openTime: string;
  serviceType?: string;
  category?: string;
  requester?: string;
  requesterEmail?: string;
  sla?: string;
  tags?: string[];
  resolutionSummary?: string;
  knowledgeBaseId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolvedSector?: string;
  resolutionTimeSpent?: string;
  participantCollaborator?: string;
  participantCollaboratorId?: string;
  participantCollaboratorAvatar?: string;
  participantRole?: string;
  history?: TicketHistoryItem[];
  description?: string;
  contactEmail?: string;
  slaLimitHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnowledgeArticle {
  id: string;
  code: string;
  title: string;
  sector: Sector;
  serviceType: string;
  category: 'Acessos & Identidade' | 'Redes & Conectividade' | 'Bancos de Dados' | 'Aplicações & APIs' | 'Infraestrutura & Nuvem' | 'Segurança & LGPD' | 'Hardware & Periféricos' | 'Sistemas & ERP';
  summarySolution: string;
  detailedProcedure: string[];
  estimatedResolutionMinutes: number;
  tags: string[];
  usefulCount: number;
  lastUpdated: string;
  author: string;
}

export interface EquipmentItem {
  id: string;
  tag: string;
  type: string;
  category?: 'Mobiliário' | 'Informática' | 'Rede & Infra' | 'Audiovisual' | 'Eletro & Escritório' | 'Geral';
  model: string;
  sector?: string;
  assignee: string;
  status: 'Em uso' | 'Estoque' | 'Manutenção' | 'Baixado';
  deliveryDate: string;
  barcode?: string;
  location?: string;
  acquisitionDate?: string;
  valueBRL?: string;
}

export interface MarketingVideoItem {
  id: string;
  title: string;
  theme: string;
  status: 'Roteiro pronto' | 'Renderizando' | 'Pronto para publicar';
  platform: string;
  duration: string;
  scriptPreview: string;
}

export type ViewScreen = 
  | 'login'
  | 'dashboard'
  | 'colaboradores'
  | 'planilhas'
  | 'agenda'
  | 'meu_kanban'
  | 'kanban_equipe'
  | 'visao_semanal'
  | 'sobreaviso'
  | 'registro_ponto'
  | 'gestao_ponto'
  | 'espelho_ponto'
  | 'clientes'
  | 'chamados'
  | 'equipamentos'
  | 'mobilidade'
  | 'relatorios'
  | 'auditoria'
  | 'organograma'
  | 'visao_geral'
  | 'design_system'
  | 'configuracoes';

export interface OnCallShift {
  id: string;
  user_id: string;
  user_name: string;
  sector_id?: string;
  sector_name: string;
  device_id?: string;
  device_tag?: string;
  device_phone?: string;
  start_at: string;
  end_at: string;
  status: 'AGENDADO' | 'EM_SOBREAVISO' | 'FINALIZADO' | 'CANCELADO';
  notes?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateVehicle {
  id: string;
  model: string;
  plate: string;
  current_km: number;
  last_fuel_date?: string;
  fuel_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CorporateDevice {
  id: string;
  patrimony_tag: string;
  barcode?: string;
  name: string;
  category: string;
  model: string;
  serial_number?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  sector?: string;
  status: string;
  acquisition_date?: string;
  delivery_date?: string;
  warranty_until?: string;
  value_brl?: number;
  specifications: {
    type?: string;
    imei?: string;
    phone_number?: string;
    assigned_technician_day?: string;
    carrier?: string;
    is_on_call_device?: boolean;
    mobility_status?: 'Disponível' | 'Em uso' | 'Em plantão' | 'Manutenção' | 'Bloqueado' | 'Inativo';
    last_battery_level?: number;
    gps_accuracy?: string;
    tracking_status?: 'ONLINE' | 'STANDBY' | 'OFFLINE';
    last_telemetry_at?: string;
    current_trip_id?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface DeviceAssignment {
  id: string;
  equipment_id: string;
  user_id: string;
  user_name: string;
  sector_id?: string;
  sector_name?: string;
  assigned_at: string;
  returned_at?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  status: 'ATIVO' | 'DEVOLVIDO';
  purpose: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  patrimony_tag?: string;
  device_name?: string;
  device_model?: string;
  phone_number?: string;
}

export interface RoutePoint {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy_meters: number;
  speed_kmh: number;
  heading?: number;
  altitude?: number;
  battery_level?: number;
  is_valid: boolean;
  label?: string;
  created_at?: string;
}

export interface VehicleTrip {
  id: string;
  user_id: string;
  user_name: string;
  device_id?: string;
  device_name?: string;
  shift_id?: string;
  vehicle_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  last_fuel_date?: string;
  origin_address: string;
  ticket_id?: string;
  ticket_protocol?: string;
  task_id?: string;
  task_title?: string;
  purpose: string;
  destination: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  start_at: string;
  end_at?: string;
  duration_seconds: number;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  total_distance_km: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  points_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  route_points?: RoutePoint[];
}

export interface MobilityMetrics {
  activeTripsCount: number;
  onCallDevicesCount: number;
  activeVehiclesCount: number;
  kmToday: number;
  kmThisMonth: number;
  totalTripsCompleted: number;
  recentTrips: VehicleTrip[];
}
