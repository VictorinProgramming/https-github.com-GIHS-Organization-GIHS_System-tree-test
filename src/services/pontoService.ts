import { CURRENT_USER } from '../data/mockData';
import { dbService } from './dbService';

export interface PontoLocation {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  approximateAddress: string;
  city: string;
  state: string;
  country?: string;
  ipAddress: string;
  isp?: string;
  source: 'GPS_SATELLITE' | 'NETWORK_IP' | 'HYBRID';
  isApproximate: boolean;
}

export interface PontoRecord {
  id: string;
  nsr: string;
  type: 'ENTRADA' | 'INÍCIO DO INTERVALO' | 'RETORNO' | 'SAÍDA';
  time: string;
  date: string;
  timestamp: number;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorSector: string;
  collaboratorMatricula: string;
  photoUrl: string;
  biometricMatchConfidence: number;
  deviceType: 'Celular' | 'Tablet' | 'Notebook' | 'Desktop';
  deviceDetails: string;
  ipAddress: string;
  location: PontoLocation;
  sha256Hash: string;
}

const STORAGE_KEY = 'bycomp_ponto_records_v1';

// Seed initial empty state for today so the day does NOT auto-start!
// "Ao iniciar o dia, não startar o registro automático"
class PontoService {
  private records: PontoRecord[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.syncFromFirestore();
  }

  private async syncFromFirestore() {
    try {
      const remoteRecords = await dbService.getPontoRecords();
      if (remoteRecords && remoteRecords.length > 0) {
        // Merge records by ID, prioritizing latest
        const map = new Map<string, PontoRecord>();
        // Add existing local
        this.records.forEach((r) => map.set(r.id, r));
        // Add remote
        remoteRecords.forEach((r) => map.set(r.id, r));
        this.records = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('Could not hydrate ponto records from Firestore:', err);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.records = JSON.parse(stored);
      } else {
        this.records = [];
      }
    } catch {
      this.records = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.error('Failed to persist ponto records:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in pontoService listener:', err);
      }
    });
  }

  public getAllRecords(): PontoRecord[] {
    return [...this.records];
  }

  public getRecordsForCollaborator(colabName: string): PontoRecord[] {
    return this.records.filter(r => r.collaboratorName.toLowerCase() === colabName.toLowerCase());
  }

  public getTodayRecords(colabName?: string): PontoRecord[] {
    const today = new Date().toLocaleDateString('pt-BR');
    return this.records.filter(r => {
      const isToday = r.date === today;
      if (colabName) {
        return isToday && r.collaboratorName.toLowerCase() === colabName.toLowerCase();
      }
      return isToday;
    });
  }

  // Alias compatible with getTodayPunches(id?, name?)
  public getTodayPunches(collaboratorId?: string, colabName?: string): PontoRecord[] {
    const today = new Date().toLocaleDateString('pt-BR');
    return this.records.filter(r => {
      const isToday = r.date === today;
      if (collaboratorId && r.collaboratorId === collaboratorId) {
        return isToday;
      }
      if (colabName) {
        return isToday && r.collaboratorName.toLowerCase() === colabName.toLowerCase();
      }
      return isToday;
    });
  }

  public getWorkStatus(colabName?: string): 'Jornada Não Iniciada' | 'Em expediente' | 'Intervalo' | 'Encerrado' {
    const todayPunches = this.getTodayRecords(colabName);
    if (todayPunches.length === 0) {
      return 'Jornada Não Iniciada'; // Start of day: no auto-registration!
    }

    const latest = todayPunches[0]; // sorted descending by timestamp
    if (latest.type === 'ENTRADA' || latest.type === 'RETORNO') {
      return 'Em expediente';
    }
    if (latest.type === 'INÍCIO DO INTERVALO') {
      return 'Intervalo';
    }
    if (latest.type === 'SAÍDA') {
      return 'Encerrado';
    }
    return 'Em expediente';
  }

  // Alias compatible with getCurrentWorkStatus(id?, name?)
  public getCurrentWorkStatus(collaboratorId?: string, colabName?: string): 'Jornada Não Iniciada' | 'Em expediente' | 'Intervalo' | 'Encerrado' {
    const todayPunches = this.getTodayPunches(collaboratorId, colabName);
    if (todayPunches.length === 0) {
      return 'Jornada Não Iniciada';
    }

    const latest = todayPunches[0];
    if (latest.type === 'ENTRADA' || latest.type === 'RETORNO') {
      return 'Em expediente';
    }
    if (latest.type === 'INÍCIO DO INTERVALO') {
      return 'Intervalo';
    }
    if (latest.type === 'SAÍDA') {
      return 'Encerrado';
    }
    return 'Em expediente';
  }

  // Register a new punch (alias for registerPunch and addPunch)
  public registerPunch(
    punch: Omit<PontoRecord, 'id' | 'nsr' | 'sha256Hash' | 'time' | 'date' | 'timestamp'> & {
      time?: string;
      date?: string;
      timestamp?: number;
    }
  ): PontoRecord {
    return this.addPunch(punch);
  }

  public addPunch(
    punch: Omit<PontoRecord, 'id' | 'nsr' | 'sha256Hash' | 'time' | 'date' | 'timestamp'> & {
      time?: string;
      date?: string;
      timestamp?: number;
    }
  ): PontoRecord {
    const randomHex = Math.random().toString(16).substring(2, 10);
    const id = `PNT-${Date.now()}-${randomHex}`;
    const seq = String(this.records.length + 1).padStart(5, '0');
    const nsr = `NSR-${new Date().getFullYear()}-${seq}`;

    // Compute synthetic SHA-256 hash
    const raw = `${nsr}|${punch.timestamp || Date.now()}|${punch.collaboratorMatricula}|${punch.type}|${punch.ipAddress}|${punch.location.latitude}|${punch.location.longitude}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const sha256Hash = Math.abs(hash).toString(16).padStart(16, '0') + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18) + Math.random().toString(16).substring(2, 18);

    const completeRecord: PontoRecord = {
      ...punch,
      id,
      nsr,
      sha256Hash,
      date: punch.date || new Date().toLocaleDateString('pt-BR'),
      time: punch.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: punch.timestamp || Date.now()
    };

    this.records = [completeRecord, ...this.records];
    this.saveToStorage();
    // Asynchronously synchronize to Firestore
    dbService.savePontoRecord(completeRecord).catch((err) => {
      console.warn('Could not sync punch to Firestore:', err);
    });
    return completeRecord;
  }

  public clearTodayPunchesForTesting(colabName?: string) {
    const today = new Date().toLocaleDateString('pt-BR');
    this.records = this.records.filter(r => {
      const isToday = r.date === today;
      if (colabName) {
        return !(isToday && r.collaboratorName.toLowerCase() === colabName.toLowerCase());
      }
      return !isToday;
    });
    this.saveToStorage();
  }
}

export const pontoService = new PontoService();
