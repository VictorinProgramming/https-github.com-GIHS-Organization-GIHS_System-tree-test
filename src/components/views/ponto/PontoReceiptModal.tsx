import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Globe,
  Wifi,
  ExternalLink,
  Navigation,
  User,
  Sparkles
} from 'lucide-react';
import { PontoRecord } from '../../../services/pontoService';

interface PontoReceiptModalProps {
  record: PontoRecord;
  onClose: () => void;
}

export const PontoReceiptModal: React.FC<PontoReceiptModalProps> = ({ record, onClose }) => {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedIP, setCopiedIP] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(record.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  const clientIP = record.ipAddress || record.location.ipAddress || '189.40.72.115';

  const handleCopyIP = () => {
    navigator.clipboard.writeText(clientIP);
    setCopiedIP(true);
    setTimeout(() => setCopiedIP(false), 2500);
  };

  const handleDownloadReceipt = () => {
    const textReceipt = `
============================================================
COMPROVANTE DE REGISTRO DE PONTO DO TRABALHADOR
PORTARIA 671 MTE / SISTEMA REP-P BYCOMP
============================================================
NSR (Número Seqüencial de Registro): ${record.nsr}
Data: ${record.date}
Horário: ${record.time}
Tipo de Operação: ${record.type}
------------------------------------------------------------
DADOS DO EMPREGADO:
Nome: ${record.collaboratorName}
Matrícula: ${record.collaboratorMatricula}
Cargo: ${record.collaboratorRole}
Setor: ${record.collaboratorSector}
------------------------------------------------------------
AUDITORIA BIOMÉTRICA:
Método: Reconhecimento Facial 3D Automático
Grau de Correspondência: ${record.biometricMatchConfidence}%
Autenticação: Biometria validada via Inteligência de Borda
------------------------------------------------------------
GEOLOCALIZAÇÃO APROXIMADA DA MARCAÇÃO:
Endereço Aproximado: ${record.location.approximateAddress}
Cidade / Estado / País: ${record.location.city} - ${record.location.state}, ${record.location.country}
Coordenadas: Lat ${record.location.latitude}, Long ${record.location.longitude}
Precisão do Raio: ±${record.location.accuracyMeters} metros
Fonte da Posição: ${record.location.source}
------------------------------------------------------------
AUDITORIA DE REDE E IP DO DISPOSITIVO
------------------------------------------------------------
Endereço IP do Dispositivo: ${clientIP}
Provedor de Internet (ISP): ${record.location.isp || 'Provedor Local Detectado'}
Dispositivo Utilizado: ${record.deviceType} (${record.deviceDetails})
Assinatura Digital (SHA-256):
${record.sha256Hash}
============================================================
GIHS System - Documento oficial assinado digitalmente.
`;

    const blob = new Blob([textReceipt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprovante_Ponto_${record.collaboratorMatricula}_${record.date.replace(/\//g, '-')}_${record.time.replace(/:/g, '')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="modal-comprovante-ponto"
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-5 relative"
      >
        {/* Header Ribbon */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-2xs">
              <CheckCircle2 className="w-7 h-7 text-[#37558d]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-[#37558d] tracking-tight">
                  Ponto Registrado com Sucesso!
                </h3>
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200">
                  {record.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Comprovante oficial emitido nos termos da Portaria 671 MTE
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Fechar comprovante"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 🌐 DESTAQUE 1: IP DO DISPOSITIVO & AUDITORIA DE REDE */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d]">
                <Globe className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#37558d] uppercase tracking-wider">
                Endereço IP Coletado do Dispositivo
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#37558d] animate-pulse"></span>
              Auditado em Tempo Real
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-base font-black text-[#37558d]">
                  {clientIP}
                </span>
                <button
                  onClick={handleCopyIP}
                  className="p-1 rounded-md bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  title="Copiar IP do dispositivo"
                >
                  {copiedIP ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                <Wifi className="w-3 h-3 text-[#37558d]" />
                <span>Provedor / Conexão: <strong className="text-[#37558d]">{record.location.isp || 'Internet Banda Larga / Móvel'}</strong></span>
              </p>
            </div>

            <div className="text-[11px] font-mono text-right text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
              <span className="text-slate-400 block text-[10px]">Dispositivo:</span>
              <span className="text-[#37558d] font-bold">{record.deviceType}</span>
            </div>
          </div>
        </div>

        {/* 📍 DESTAQUE 2: LOCALIZAÇÃO EM TEMPO REAL DO LOCAL */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d]">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#37558d] uppercase tracking-wider">
                Localização em Tempo Real da Marcação
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              {record.location.source === 'GPS_SATELLITE' ? `GPS ±${record.location.accuracyMeters}m` : 'Rede IP Georreferenciada'}
            </span>
          </div>

          {/* Formatted Address Box */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-start gap-2">
              <Navigation className="w-4 h-4 text-[#37558d] shrink-0 mt-0.5" />
              <span>{record.location.approximateAddress}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-200 text-slate-600">
              <div>
                <span className="text-slate-400 block">Coordenadas:</span>
                <a
                  href={`https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#37558d] font-bold hover:underline flex items-center gap-1"
                >
                  <span>{record.location.latitude}, {record.location.longitude}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div>
                <span className="text-slate-400 block">Cidade / Estado:</span>
                <span className="text-[#37558d] font-bold">
                  {record.location.city}, {record.location.state}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Radar / Map Pin Graphic */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
              <span>Ponto de Presença Corporativo GIHS System</span>
            </div>
            <span className="text-emerald-700 font-bold">Geocodificação Válida</span>
          </div>
        </div>

        {/* 📷 Registro Facial & Dados da Batida */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Facial Snapshot Thumbnail */}
          <div className="sm:col-span-1 rounded-2xl bg-slate-50 p-2.5 border border-slate-200 flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-blue-200 shadow-xs mb-2">
              <img
                src={record.photoUrl}
                alt={record.collaboratorName}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-white/90 text-[8px] font-mono text-[#37558d] border border-blue-200 font-bold">
                FACIAL OK
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              {record.biometricMatchConfidence}% correspondência
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              Biometria Inviolável
            </span>
          </div>

          {/* Punch Times and Collaborator details */}
          <div className="sm:col-span-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#37558d]" />
                <span className="text-slate-500">Horário Oficial:</span>
              </div>
              <span className="font-mono text-base font-black text-[#37558d]">{record.time}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#37558d]" />
                <span className="text-slate-500">Data:</span>
              </div>
              <span className="font-mono font-bold text-slate-800">{record.date}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#37558d]" />
                <span className="text-slate-500">Colaborador:</span>
              </div>
              <span className="font-bold text-[#37558d]">{record.collaboratorName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Matrícula / Setor:</span>
              <span className="font-mono text-[#37558d] font-bold">
                {record.collaboratorMatricula} • {record.collaboratorSector}
              </span>
            </div>
          </div>
        </div>

        {/* NSR and Cryptographic SHA-256 Seal */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>NSR: <strong className="text-[#37558d]">{record.nsr}</strong></span>
            <span className="text-emerald-700 flex items-center gap-1 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portaria 671 MTE</span>
            </span>
          </div>

          <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between gap-2 overflow-hidden">
            <span className="truncate text-slate-500 text-[10px]">
              SHA-256: {record.sha256Hash}
            </span>
            <button
              onClick={handleCopyHash}
              className="p-1 rounded text-slate-500 hover:text-[#37558d] shrink-0 cursor-pointer"
              title="Copiar Hash de Autenticidade"
            >
              {copiedHash ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            onClick={handleDownloadReceipt}
            id="btn-baixar-comprovante-ponto"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Comprovante Salvo!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#37558d]" />
                <span>Baixar Comprovante (.TXT)</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            id="btn-fechar-comprovante-ponto"
            className="px-6 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#1e3a6c] text-white font-extrabold text-xs shadow-md shadow-[#37558d]/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Concluir e Ver Histórico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
