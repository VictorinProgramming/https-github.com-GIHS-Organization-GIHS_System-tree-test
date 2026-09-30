import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Camera,
  Scan,
  RefreshCw,
  FileCheck,
  Globe,
  RotateCcw,
  Smartphone,
  Tablet,
  Laptop,
  Monitor
} from 'lucide-react';
import { pontoService, PontoRecord } from '../../services/pontoService';
import { FacialRecognitionModal } from './ponto/FacialRecognitionModal';
import { PontoReceiptModal } from './ponto/PontoReceiptModal';
import { CURRENT_USER } from '../../data/mockData';
import { Collaborator, ViewScreen } from '../../types';
import { 
  getRealTimeLocationAndIP, 
  fetchPublicIPAndNetwork, 
  detectDeviceCategory, 
  DeviceCategory,
  NetworkDeviceInfo
} from '../../utils/geolocationAndDevice';

interface TimeClockViewProps {
  onNavigate?: (screen: ViewScreen) => void;
  currentUser?: Collaborator;
}

export const TimeClockView: React.FC<TimeClockViewProps> = ({
  onNavigate,
  currentUser = CURRENT_USER
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [punches, setPunches] = useState<PontoRecord[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Real-time IP, ISP and Geolocation state
  const [networkInfo, setNetworkInfo] = useState<NetworkDeviceInfo | null>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const [isRefreshingTelemetry, setIsRefreshingTelemetry] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<{ category: DeviceCategory; details: string }>({
    category: 'Desktop',
    details: 'Detectando...'
  });

  // Modal management
  const [activePunchType, setActivePunchType] = useState<'ENTRADA' | 'INÍCIO DO INTERVALO' | 'RETORNO' | 'SAÍDA' | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PontoRecord | null>(null);

  // Digital live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch punches & subscribe to real-time updates
  useEffect(() => {
    setPunches(pontoService.getTodayPunches(currentUser.id, currentUser.name));

    const unsubscribe = pontoService.subscribe(() => {
      setPunches(pontoService.getTodayPunches(currentUser.id, currentUser.name));
    });

    return () => unsubscribe();
  }, [currentUser.id, currentUser.name]);

  // Initial load of IP, Geolocation and Device Category
  const refreshTelemetry = async () => {
    setIsRefreshingTelemetry(true);
    try {
      const detected = detectDeviceCategory();
      setDeviceInfo(detected);

      // Concurrently fetch real-time public IP and GPS location
      const [net, loc] = await Promise.all([
        fetchPublicIPAndNetwork(),
        getRealTimeLocationAndIP()
      ]);
      setNetworkInfo(net);
      setLiveLocation(loc);
    } catch (e) {
      console.warn('Telemetry refresh error:', e);
    } finally {
      setIsRefreshingTelemetry(false);
    }
  };

  useEffect(() => {
    refreshTelemetry();
  }, []);

  // Work journey status
  const workStatus = pontoService.getCurrentWorkStatus(currentUser.id, currentUser.name);

  // Recommended next punch in work lifecycle
  const getNextRecommendedPunch = (): 'ENTRADA' | 'INÍCIO DO INTERVALO' | 'RETORNO' | 'SAÍDA' => {
    if (punches.length === 0) return 'ENTRADA';
    const last = punches[0];
    if (last.type === 'ENTRADA') return 'INÍCIO DO INTERVALO';
    if (last.type === 'INÍCIO DO INTERVALO') return 'RETORNO';
    if (last.type === 'RETORNO') return 'SAÍDA';
    return 'SAÍDA';
  };

  // Trigger Facial Recognition Modal
  const handleInitiateFacialScan = (type: 'ENTRADA' | 'INÍCIO DO INTERVALO' | 'RETORNO' | 'SAÍDA') => {
    setActivePunchType(type);
  };

  // Called when facial recognition validates and completes
  const handleFacialScanSuccess = (record: PontoRecord) => {
    setActivePunchType(null);
    setSelectedReceipt(record);
    setFeedback(`✓ ${record.type} registrada com sucesso por Reconhecimento Facial às ${record.time}!`);
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleResetForTesting = () => {
    pontoService.clearTodayPunchesForTesting(currentUser.name);
    setFeedback('Dia reiniciado para teste. Jornada aguardando início por reconhecimento facial.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const getStatusBadge = () => {
    switch (workStatus) {
      case 'Jornada Não Iniciada':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Aguardando Início (Registro Facial)</span>
          </div>
        );
      case 'Em expediente':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>🟢 Em Expediente</span>
          </div>
        );
      case 'Intervalo':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>☕ Em Intervalo / Almoço</span>
          </div>
        );
      case 'Encerrado':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
            <span>⏹️ Jornada Encerrada</span>
          </div>
        );
    }
  };

  const getDeviceIcon = () => {
    switch (deviceInfo.category) {
      case 'Celular':
        return <Smartphone className="w-4 h-4 text-[#37558d]" />;
      case 'Tablet':
        return <Tablet className="w-4 h-4 text-[#37558d]" />;
      case 'Notebook':
        return <Laptop className="w-4 h-4 text-[#37558d]" />;
      case 'Desktop':
      default:
        return <Monitor className="w-4 h-4 text-[#37558d]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Title Bar - White with Blue typography identical to CollaboratorsView */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-[#37558d] shadow-2xs">
              <Clock className="w-5 h-5 text-[#37558d]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#37558d] tracking-tight">Registro de Ponto</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                  LGPD & PORTARIA 671 MTE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reconhecimento Facial Universal (Celular, Tablet, Notebook, Desktop) & Geolocalização
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <span className="text-xs font-mono text-[#37558d] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#37558d]" />
            <span>Portaria 671 MTE</span>
          </span>

          {onNavigate && (
            <button
              onClick={() => onNavigate('espelho_ponto')}
              className="text-xs text-[#37558d] hover:text-[#1e3a6c] px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold transition-colors cursor-pointer"
            >
              Espelho de Ponto
            </button>
          )}
        </div>
      </div>

      {/* Universal Device, IP & Geolocation Compliance Banner - White background with Blue typography */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shrink-0">
            {getDeviceIcon()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[#37558d]">
                Dispositivo: {deviceInfo.category}
              </span>
              
              {/* Real-time IP Address Badge */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#37558d]" />
                <span>IP: {networkInfo?.ip || 'Coletando IP...'}</span>
              </span>

              {/* Real-time Geolocation Status Badge */}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>{liveLocation ? `GPS: ${liveLocation.city} - ${liveLocation.state}` : 'Localizando...'}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Provedor: <strong className="text-[#37558d]">{networkInfo?.isp || 'Conexão Internet Ativa'}</strong> • Localização em tempo real: <strong className="text-[#37558d]">{liveLocation?.approximateAddress || 'Obtendo coordenadas do dispositivo...'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <button
            onClick={refreshTelemetry}
            disabled={isRefreshingTelemetry}
            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#37558d] text-[11px] font-bold flex items-center gap-1.5 border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Atualizar IP e Localização em tempo real"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshingTelemetry ? 'animate-spin text-[#37558d]' : ''}`} />
            <span>{isRefreshingTelemetry ? 'Atualizando...' : 'Atualizar IP/GPS'}</span>
          </button>

          {punches.length > 0 && (
            <button
              onClick={handleResetForTesting}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 text-[11px] font-bold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer shrink-0"
              title="Reinicia as batidas de hoje do colaborador para testar o início do dia"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resetar Dia</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div 
          id="ponto-feedback-toast"
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-md"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{feedback}</span>
          </div>
          {punches[0] && (
            <button
              onClick={() => setSelectedReceipt(punches[0])}
              className="text-xs font-bold text-[#37558d] hover:text-[#1e3a6c] underline cursor-pointer shrink-0"
            >
              Ver Comprovante & Localização
            </button>
          )}
        </div>
      )}

      {/* Central Interactive Time Clock Card - Branco com letras azuis (#37558d) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* User identification info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#37558d]/30 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#37558d] text-white flex items-center justify-center text-[10px] font-mono border-2 border-white">
                <Scan className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#37558d] tracking-tight">
                {currentUser.name}
              </h2>
              <p className="text-xs text-[#37558d] font-semibold">
                {currentUser.sector} • {currentUser.role}
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                Matrícula: {currentUser.id.replace('colab-', 'NEX-04')} • Admissão: 10/02/2024
              </span>
            </div>
          </div>

          {/* Current Status Badge */}
          <div className="flex flex-col sm:items-end">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">
              Status da Jornada
            </span>
            {getStatusBadge()}
          </div>
        </div>

        {/* Live Digital Clock & Date */}
        <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-500 mb-1 capitalize">
            <Calendar className="w-3.5 h-3.5 text-[#37558d]" />
            <span>{currentDateFormatted || 'Carregando data...'}</span>
          </div>
          <div className="font-mono text-5xl sm:text-6xl font-black text-[#37558d] tracking-widest drop-shadow-xs">
            {currentTime || '00:00:00'}
          </div>
          <span className="text-[11px] font-mono text-[#37558d] font-semibold mt-1 block">
            Horário de Brasília (Sincronizado via NTP)
          </span>
        </div>

        {/* 📷 BOTÃO PRINCIPAL DE DESTAQUE: BATER PONTO EXCLUSIVO POR RECONHECIMENTO FACIAL */}
        <div className="p-1 rounded-2xl bg-gradient-to-r from-[#37558d] via-[#1e3a6c] to-[#37558d] shadow-lg shadow-[#37558d]/20">
          <button
            onClick={() => handleInitiateFacialScan(getNextRecommendedPunch())}
            id="btn-iniciar-reconhecimento-facial-principal"
            className="w-full py-4 px-6 rounded-[14px] bg-white hover:bg-slate-50 text-[#37558d] flex flex-col sm:flex-row items-center justify-between gap-3 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-[#37558d] border border-blue-200 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 shrink-0">
                <Camera className="w-6 h-6 text-[#37558d]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-[#37558d] tracking-tight">
                    Bater Ponto por Reconhecimento Facial Automático
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200">
                    Próximo: {getNextRecommendedPunch()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Reconhece a biometria cadastrada no banco de dados e bate o ponto automaticamente sem precisar de clique
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#37558d] group-hover:bg-[#1e3a6c] text-white font-extrabold text-xs shadow-xs shrink-0 transition-colors">
              <Scan className="w-4 h-4" />
              <span>Abrir Câmera (Automático)</span>
            </div>
          </button>
        </div>

        {/* Notice: Biometric Facial Punch in full automation */}
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-[#37558d] flex items-center justify-between gap-3 font-medium">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#37558d] shrink-0" />
            <span>
              O registro do ponto é realizado de forma contínua e 100% automatizada por <strong>Reconhecimento Facial</strong> (Portaria 671 MTE), identificando automaticamente a etapa da sua jornada.
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-blue-200 text-[#37558d] font-bold text-[11px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Fluxo Automático</span>
          </div>
        </div>

        {/* Today's Registration Audit Trail with Approximate Location Display */}
        <div className="mt-4 pt-4 border-t border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-[#37558d] text-sm">
              Batidas Registradas Hoje ({punches.length}):
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Registros gravados com foto & geolocalização
            </span>
          </div>

          {punches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <Camera className="w-8 h-8 text-[#37558d]/50 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Nenhum ponto registrado hoje para {currentUser.name}.
              </p>
              <p className="text-[11px] text-[#37558d] font-bold">
                Clique no botão de Reconhecimento Facial acima para iniciar sua jornada.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {punches.map((punch) => (
                <div
                  key={punch.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail of Facial Capture */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-blue-200 shrink-0 shadow-xs">
                      <img
                        src={punch.photoUrl}
                        alt={punch.collaboratorName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#37558d]/10"></div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-[#37558d] text-xs">{punch.type}</span>
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                          {punch.biometricMatchConfidence}% Facial
                        </span>
                        <span className="text-[10px] font-mono text-[#37558d] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-bold flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-[#37558d]" />
                          <span>IP {punch.ipAddress || punch.location.ipAddress}</span>
                        </span>
                      </div>

                      {/* 📍 Approximate Location display */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mt-1">
                        <MapPin className="w-3 h-3 text-[#37558d] shrink-0" />
                        <span className="truncate max-w-xs sm:max-w-md font-medium text-slate-700">
                          {punch.location.approximateAddress}
                        </span>
                        <span className="text-[10px] font-mono text-[#37558d] font-bold shrink-0">
                          (±{punch.location.accuracyMeters}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-slate-200 pt-2 sm:pt-0">
                    <div className="text-right">
                      <span className="text-sm font-mono font-black text-[#37558d] block">
                        {punch.time}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {punch.nsr}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(punch)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-[#37558d] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Abrir comprovante oficial e mapa de localização"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-[#37558d]" />
                      <span>Comprovante</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 📷 Modal 1: Facial Recognition Camera Scanner */}
      {activePunchType && (
        <FacialRecognitionModal
          punchType={activePunchType}
          currentUser={currentUser}
          onClose={() => setActivePunchType(null)}
          onSuccess={handleFacialScanSuccess}
        />
      )}

      {/* 📍 Modal 2: Official Digital Receipt with Approximate Location */}
      {selectedReceipt && (
        <PontoReceiptModal
          record={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
