import { Collaborator, OrganizationalSector, UserRole } from '../types';
import { PontoRecord } from './pontoService';
import { apiBackendService } from './apiBackendService';
import { USER_CREDENTIALS } from '../data/authCredentials';

export type DatabaseProviderType = 'POSTGRESQL';

export interface FacialBiometryData {
  photoUrl: string;
  biometricHash: string;
  registeredAt: string;
  landmarksCount: number;
  confidenceScore: number;
  active: boolean;
  notes?: string;
}

export interface UserDbModel {
  id: string;
  name: string;
  email: string;
  password?: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
  role: string;
  userRole: UserRole;
  area: string;
  sector: string;
  avatar: string;
  status: 'Em atividade' | 'Intervalo' | 'Ausente' | 'Férias' | 'Bloqueado';
  currentTask: string;
  phone: string;
  admissionDate: string;
  contractType?: 'CLT' | 'PJ' | 'Estágio';
  salaryBracket?: string;
  workSchedule?: string;
  emergencyContact?: string;
  cpfMasked?: string;
  asoStatus?: 'Em dia' | 'A renovar' | 'Pendente';
  benefits?: string[];
  facialData?: FacialBiometryData;
  createdAt: string;
  updatedAt: string;
}

// Master User default configuration
export const MASTER_USER_CONFIG: UserDbModel = {
  id: 'user-master-victor-hugo',
  name: 'Victor Hugo',
  email: 'victor.hugo@bycomp.com.br',
  mustChangePassword: false,
  role: 'Diretor Geral & Super Administrador Master',
  userRole: 'SUPER_ADMIN',
  area: 'GESTAO',
  sector: 'Gestão',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  status: 'Em atividade',
  currentTask: 'Governança Corporativa e Gestão Estratégica Global',
  phone: '(11) 98765-4321',
  admissionDate: '2021-01-10',
  contractType: 'PJ',
  salaryBracket: 'Diretoria Executiva',
  workSchedule: 'Dedicação Exclusiva / Flexível',
  emergencyContact: '(11) 98888-0001',
  facialData: {
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    biometricHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    registeredAt: new Date().toISOString(),
    landmarksCount: 68,
    confidenceScore: 99.4,
    active: true,
    notes: 'Biometria facial padrão cadastrada para reconhecimento facial no ponto'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

class DbService {
  private activeProvider: DatabaseProviderType = 'POSTGRESQL';
  private usersCache: UserDbModel[] = [];
  private usersListeners: Set<(users: UserDbModel[]) => void> = new Set();
  private sectorsCache: OrganizationalSector[] = [];
  private sectorsListeners: Set<(sectors: OrganizationalSector[]) => void> = new Set();
  private pollInterval: any = null;

  constructor() {
    this.startPolling();
  }

  public getActiveProvider(): DatabaseProviderType {
    return 'POSTGRESQL';
  }

  public setActiveProvider(provider: DatabaseProviderType) {
    this.activeProvider = 'POSTGRESQL';
  }

  private startPolling() {
    this.fetchUsersAndNotify();
    if (!this.pollInterval && typeof window !== 'undefined') {
      this.pollInterval = setInterval(() => {
        this.fetchUsersAndNotify();
      }, 5000);
    }
  }

  private async fetchUsersAndNotify() {
    try {
      const res = await apiBackendService.getUsers();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const users: UserDbModel[] = res.data.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          userRole: u.user_role as UserRole,
          area: u.area || 'ADMINISTRATIVO',
          sector: u.sector_name || u.sector || 'N1',
          avatar: u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
          phone: u.phone || '(11) 98765-4321',
          admissionDate: u.admission_date || '2024-01-10',
          status: (u.status as any) || 'Em atividade',
          currentTask: u.current_task || 'Operações Ativas',
          contractType: u.contract_type || 'CLT',
          salaryBracket: u.salary_bracket,
          workSchedule: u.work_schedule,
          emergencyContact: u.emergency_contact,
          facialData: u.facial_active ? {
            photoUrl: u.facial_photo_url || u.avatar_url,
            biometricHash: u.facial_biometric_hash || `sha256:${u.id}`,
            registeredAt: u.facial_registered_at || new Date().toISOString(),
            landmarksCount: u.facial_landmarks_count || 68,
            confidenceScore: parseFloat(u.facial_confidence_score) || 99.4,
            active: true
          } : undefined,
          createdAt: u.created_at || new Date().toISOString(),
          updatedAt: u.updated_at || new Date().toISOString()
        }));

        this.usersCache = users;
        this.usersListeners.forEach((fn) => fn(users));
        return;
      }
    } catch {
      // Standby
    }

    if (this.usersCache.length === 0) {
      // Use local Master list
      const fallbackMasters: UserDbModel[] = USER_CREDENTIALS.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.roleLabel || 'Master',
        userRole: m.role,
        area: m.area,
        sector: m.sector,
        avatar: m.avatar,
        status: m.status,
        currentTask: m.currentTask,
        phone: m.phone,
        admissionDate: m.admissionDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      this.usersCache = fallbackMasters;
      this.usersListeners.forEach((fn) => fn(fallbackMasters));
    }
  }

  // Initialize DB directly with PostgreSQL
  public async initializeDatabase(): Promise<UserDbModel> {
    try {
      const pgUserRes = await apiBackendService.getUserById(MASTER_USER_CONFIG.id);
      if (pgUserRes.success && pgUserRes.data) {
        const pg = pgUserRes.data;
        return {
          id: pg.id,
          name: pg.name,
          email: pg.email,
          role: pg.role,
          userRole: pg.user_role as UserRole,
          area: pg.area || 'ADMINISTRATIVO',
          sector: pg.sector_name || 'Gestão',
          avatar: pg.avatar_url || MASTER_USER_CONFIG.avatar,
          phone: pg.phone || MASTER_USER_CONFIG.phone,
          admissionDate: pg.admission_date || MASTER_USER_CONFIG.admissionDate,
          status: (pg.status as any) || 'Em atividade',
          currentTask: pg.current_task || MASTER_USER_CONFIG.currentTask,
          facialData: pg.facial_active ? {
            photoUrl: pg.facial_photo_url || '',
            biometricHash: pg.facial_biometric_hash || '',
            registeredAt: pg.facial_registered_at || new Date().toISOString(),
            landmarksCount: pg.facial_landmarks_count || 68,
            confidenceScore: pg.facial_confidence_score || 99.4,
            active: true
          } : MASTER_USER_CONFIG.facialData,
          createdAt: pg.created_at,
          updatedAt: pg.updated_at
        };
      }
    } catch {
      // In-memory master
    }

    return MASTER_USER_CONFIG;
  }

  public async getMasterUser(): Promise<UserDbModel> {
    try {
      const pg = await apiBackendService.getUserById(MASTER_USER_CONFIG.id);
      if (pg.success && pg.data) {
        return {
          id: pg.data.id,
          name: pg.data.name,
          email: pg.data.email,
          role: pg.data.role,
          userRole: pg.data.user_role as UserRole,
          area: pg.data.area || 'ADMINISTRATIVO',
          sector: pg.data.sector_name || 'Gestão',
          avatar: pg.data.avatar_url || MASTER_USER_CONFIG.avatar,
          phone: pg.data.phone || MASTER_USER_CONFIG.phone,
          admissionDate: pg.data.admission_date || MASTER_USER_CONFIG.admissionDate,
          status: (pg.data.status as any) || 'Em atividade',
          currentTask: pg.data.current_task || MASTER_USER_CONFIG.currentTask,
          createdAt: pg.data.created_at,
          updatedAt: pg.data.updated_at
        };
      }
    } catch {}

    return MASTER_USER_CONFIG;
  }

  public async getUserById(userId: string): Promise<UserDbModel | null> {
    try {
      const res = await apiBackendService.getUserById(userId);
      if (res?.success && res.data) {
        const u = res.data;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          userRole: u.user_role as UserRole,
          area: u.area || 'ADMINISTRATIVO',
          sector: u.sector_name || 'N1',
          avatar: u.avatar_url || '',
          phone: u.phone || '',
          admissionDate: u.admission_date || '',
          status: u.status || 'Em atividade',
          currentTask: u.current_task || '',
          createdAt: u.created_at || new Date().toISOString(),
          updatedAt: u.updated_at || new Date().toISOString()
        };
      }
    } catch {}

    const foundInCache = this.usersCache.find((u) => u.id === userId);
    if (foundInCache) return foundInCache;

    if (userId === MASTER_USER_CONFIG.id) return MASTER_USER_CONFIG;
    return null;
  }

  public async updateUserProfile(updatedUser: Partial<UserDbModel>): Promise<void> {
    const userId = updatedUser.id || MASTER_USER_CONFIG.id;
    try {
      await apiBackendService.updateUser(userId, {
        name: updatedUser.name,
        role: updatedUser.role,
        sector: updatedUser.sector,
        phone: updatedUser.phone,
        currentTask: updatedUser.currentTask,
        status: updatedUser.status as any
      });
      this.fetchUsersAndNotify();
    } catch (pgErr) {
      console.warn('PostgreSQL user update error:', pgErr);
    }
  }

  public async getFacialBiometry(userId: string): Promise<FacialBiometryData | null> {
    try {
      const pgBio = await apiBackendService.getFacialBiometry(userId);
      if (pgBio && (pgBio.photoUrl || pgBio.biometricHash)) {
        return {
          photoUrl: pgBio.photoUrl || '',
          biometricHash: pgBio.biometricHash || `sha256:${userId}`,
          registeredAt: pgBio.registeredAt || new Date().toISOString(),
          landmarksCount: pgBio.landmarksCount || 68,
          confidenceScore: pgBio.confidenceScore || 99.4,
          active: pgBio.active !== false,
          notes: pgBio.notes
        };
      }
    } catch {}

    try {
      const cached = localStorage.getItem(`bycomp_biometry_${userId}`);
      if (cached) return JSON.parse(cached);
    } catch {}

    return null;
  }

  public async saveFacialBiometry(
    userIdOrData: string | (FacialBiometryData & { collaboratorId?: string }),
    maybeBiometry?: FacialBiometryData
  ): Promise<FacialBiometryData> {
    const userId = typeof userIdOrData === 'string' ? userIdOrData : (userIdOrData.collaboratorId || MASTER_USER_CONFIG.id);
    const biometry: FacialBiometryData = typeof userIdOrData === 'string'
      ? maybeBiometry!
      : {
          photoUrl: userIdOrData.photoUrl,
          biometricHash: userIdOrData.biometricHash || 'sha256:custom-bio-hash',
          registeredAt: userIdOrData.registeredAt || new Date().toISOString(),
          landmarksCount: userIdOrData.landmarksCount || 68,
          confidenceScore: userIdOrData.confidenceScore || 99.4,
          active: userIdOrData.active !== false,
          notes: userIdOrData.notes || 'Biometria registrada'
        };

    try {
      await apiBackendService.saveFacialBiometry(userId, biometry);
    } catch (pgErr) {
      console.warn('Save facial biometry to PostgreSQL warning:', pgErr);
    }

    try {
      localStorage.setItem(`bycomp_biometry_${userId}`, JSON.stringify(biometry));
      localStorage.setItem('bycomp_latest_biometry', JSON.stringify({ userId, ...biometry }));
    } catch {}

    return biometry;
  }

  public subscribeUsers(callback: (users: UserDbModel[]) => void): () => void {
    this.usersListeners.add(callback);
    callback(this.usersCache.length > 0 ? this.usersCache : [MASTER_USER_CONFIG]);
    this.fetchUsersAndNotify();
    return () => {
      this.usersListeners.delete(callback);
    };
  }

  public async createUser(newUser: UserDbModel): Promise<void> {
    try {
      await apiBackendService.createUser({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userRole: newUser.userRole,
        area: newUser.area,
        sector: newUser.sector,
        phone: newUser.phone,
        status: newUser.status,
        contractType: newUser.contractType,
        salaryBracket: newUser.salaryBracket,
        workSchedule: newUser.workSchedule,
        emergencyContact: newUser.emergencyContact,
        cpfMasked: newUser.cpfMasked,
        asoStatus: newUser.asoStatus,
        benefits: newUser.benefits
      });
      this.fetchUsersAndNotify();
    } catch (pgErr) {
      console.warn('PostgreSQL user creation error:', pgErr);
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    try {
      await apiBackendService.deleteUser(userId);
      this.fetchUsersAndNotify();
    } catch (pgErr) {
      console.warn('PostgreSQL user delete error:', pgErr);
    }
  }

  public subscribeDeletedUsers(callback: (deletedIds: string[]) => void): () => void {
    callback([]);
    return () => {};
  }

  public async authenticateUser(
    email: string,
    passwordAttempt: string
  ): Promise<UserDbModel | null> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = passwordAttempt.trim();

    // 1. Primary: PostgreSQL Authentication Endpoint
    try {
      const pgAuthRes = await apiBackendService.login(cleanEmail, cleanPassword);
      if (pgAuthRes && pgAuthRes.success && pgAuthRes.user) {
        return pgAuthRes.user as UserDbModel;
      }
    } catch {
      // Standby
    }

    // 2. Check Masters directly in memory / credentials registry (Zero-downtime)
    const masterKnown = USER_CREDENTIALS.find(
      (m) => m.email.toLowerCase() === cleanEmail && m.password === cleanPassword
    );
    if (masterKnown) {
      return {
        id: masterKnown.id,
        name: masterKnown.name,
        email: masterKnown.email,
        role: masterKnown.roleLabel || 'Super Administrador Master',
        userRole: masterKnown.role,
        area: masterKnown.area,
        sector: masterKnown.sector,
        avatar: masterKnown.avatar,
        status: masterKnown.status,
        currentTask: masterKnown.currentTask,
        phone: masterKnown.phone,
        admissionDate: masterKnown.admissionDate,
        facialData: {
          photoUrl: masterKnown.avatar,
          biometricHash: 'sha256:master-bio',
          registeredAt: new Date().toISOString(),
          landmarksCount: 68,
          confidenceScore: 99.4,
          active: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Check users cache
    const cachedUser = this.usersCache.find(
      (u) => u.email.toLowerCase() === cleanEmail &&
        (u.password === cleanPassword || u.temporaryPassword === cleanPassword)
    );
    if (cachedUser) return cachedUser;

    return null;
  }

  public async changePassword(userId: string, newPassword: string): Promise<void> {
    try {
      await apiBackendService.updateUser(userId, {
        password: newPassword
      } as any);
    } catch (error) {
      console.warn('Password update error:', error);
    }
  }

  public async setTemporaryPassword(userId: string, tempPassword: string): Promise<void> {
    try {
      await apiBackendService.updateUser(userId, {
        temporaryPassword: tempPassword,
        mustChangePassword: true
      } as any);
    } catch (error) {
      console.warn('Temporary password update error:', error);
    }
  }

  public subscribeSectors(callback: (sectors: OrganizationalSector[]) => void): () => void {
    apiBackendService.getSectors().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        callback(res.data);
      }
    }).catch(() => {});
    return () => {};
  }

  public async saveSector(sector: OrganizationalSector): Promise<void> {
    try {
      await apiBackendService.createSector(sector);
    } catch (error) {
      console.warn('Sector save error:', error);
    }
  }

  public async deleteSector(sectorId: string): Promise<void> {
    // Delete in postgres if needed
  }

  public async savePontoRecord(record: PontoRecord): Promise<void> {
    try {
      await apiBackendService.createPontoRecord(record);
    } catch (pgErr) {
      console.info('PostgreSQL ponto punch standby:', pgErr);
    }
  }

  public async getPontoRecords(collaboratorId?: string): Promise<PontoRecord[]> {
    try {
      const res = collaboratorId 
        ? await apiBackendService.getPontoByUserId(collaboratorId) 
        : await apiBackendService.getPontoRecords();
      if (res?.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Standby
    }
    return [];
  }

  public generatePostgresSchemaDDL(): string {
    return `-- ====================================================================
-- ESQUEMA DDL OFICIAL POSTGRESQL 16+
-- Plataforma: GIHS System & GIHS Agents Enterprise Intelligence
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sectors (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    area VARCHAR(64) NOT NULL,
    leader_name VARCHAR(150),
    collaborators_count INTEGER DEFAULT 0,
    description TEXT,
    sla_target VARCHAR(32) DEFAULT '99.5%',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(120) NOT NULL,
    user_role VARCHAR(32) NOT NULL DEFAULT 'COLABORADOR',
    hierarchy_level INTEGER DEFAULT 4,
    sector_id VARCHAR(64) REFERENCES sectors(id) ON DELETE SET NULL,
    sector_name VARCHAR(120),
    area VARCHAR(64),
    avatar_url TEXT,
    phone VARCHAR(32),
    admission_date DATE,
    status VARCHAR(32) DEFAULT 'Em atividade',
    current_task TEXT,
    contract_type VARCHAR(16) DEFAULT 'CLT',
    salary_bracket VARCHAR(64),
    work_schedule VARCHAR(120) DEFAULT '08:00 - 18:00 (Segunda a Sexta)',
    emergency_contact VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE,
    facial_active BOOLEAN DEFAULT FALSE,
    facial_photo_url TEXT,
    facial_biometric_hash VARCHAR(128),
    facial_landmarks_count INTEGER DEFAULT 68,
    facial_confidence_score NUMERIC(5,2),
    facial_registered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ponto_records (
    id VARCHAR(64) PRIMARY KEY,
    nsr VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    collaborator_name VARCHAR(180) NOT NULL,
    collaborator_sector VARCHAR(120),
    type VARCHAR(32) NOT NULL,
    punch_date DATE NOT NULL,
    punch_time TIME NOT NULL,
    unix_timestamp BIGINT NOT NULL,
    photo_url TEXT,
    biometric_match_confidence NUMERIC(5,2),
    sha256_hash VARCHAR(128) NOT NULL,
    device_type VARCHAR(32),
    device_details VARCHAR(255),
    ip_address VARCHAR(45),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    accuracy_meters NUMERIC(8, 2),
    approximate_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    protocol VARCHAR(64) NOT NULL,
    client VARCHAR(180) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(64) NOT NULL,
    priority VARCHAR(32) NOT NULL DEFAULT 'Média',
    status VARCHAR(32) NOT NULL DEFAULT 'Aberto',
    assigned_to VARCHAR(180),
    assigned_avatar TEXT,
    requester_email VARCHAR(255),
    contact_email VARCHAR(255),
    open_time VARCHAR(64),
    sla_hours INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
  }
}

export const dbService = new DbService();
