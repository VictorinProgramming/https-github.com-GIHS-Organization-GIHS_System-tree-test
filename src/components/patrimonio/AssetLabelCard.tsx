import React from 'react';
import { BarcodeSVG } from './BarcodeSVG';
import { ShieldCheck, Cpu, Building2 } from 'lucide-react';

export interface AssetLabelData {
  tag: string;
  type: string;
  category?: string;
  model: string;
  sector: string;
  location?: string;
  assignee?: string;
  companyName: string;
  subTitle: string;
  logoType: 'bycomp_default' | 'patrimonio_shield' | 'custom_upload';
  customLogoUrl?: string;
  barcodeColor?: string;
  showBorder?: boolean;
}

interface AssetLabelCardProps {
  data: AssetLabelData;
  scale?: 'normal' | 'compact' | 'large';
  className?: string;
  printMode?: boolean;
}

export const AssetLabelCard: React.FC<AssetLabelCardProps> = ({
  data,
  scale = 'normal',
  className = '',
  printMode = false
}) => {
  const {
    tag,
    type,
    model,
    sector,
    location,
    companyName,
    subTitle,
    logoType,
    customLogoUrl
  } = data;

  return (
    <div
      className={`relative bg-white text-slate-900 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg select-none print:shadow-none print:border-black print:rounded-none transition-all ${
        printMode ? 'w-[75mm] h-[40mm] p-2 m-0' : 'w-full max-w-[420px] p-3.5'
      } ${className}`}
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Top Metallic Border Header */}
      <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Logo Section */}
          {logoType === 'custom_upload' && customLogoUrl ? (
            <img
              src={customLogoUrl}
              alt="Logo"
              className="h-7 max-w-[80px] object-contain"
            />
          ) : logoType === 'patrimonio_shield' ? (
            <div className="w-7 h-7 rounded bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
          ) : (
            // Default GIHS System Corporate Logo
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-[#0067FC] to-[#00A6FC] text-white font-black flex items-center justify-center text-xs tracking-tighter shadow-sm border border-[#0067FC]">
                GI
              </div>
            </div>
          )}

          <div className="leading-tight">
            <h4 className="text-[12px] font-black tracking-tight text-slate-900 uppercase">
              {companyName || 'GIHS SYSTEM'}
            </h4>
            <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
              {subTitle || 'PATRIMÔNIO & CONTROLE DE ATIVOS'}
            </p>
          </div>
        </div>

        {/* Big Tag Badge */}
        <div className="text-right">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold block">
            Nº DE PATRIMÔNIO
          </span>
          <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
            {tag || 'PAT-0000'}
          </span>
        </div>
      </div>

      {/* Equipment Type & Model Info Grid */}
      <div className="grid grid-cols-12 gap-2 my-1.5 bg-slate-50 p-2 rounded border border-slate-200">
        <div className="col-span-4 border-r border-slate-300 pr-1.5">
          <span className="text-[8px] font-bold uppercase text-slate-500 block">
            Tipo de Bem:
          </span>
          <span className="text-[11px] font-black text-slate-900 truncate block">
            {type || 'Equipamento'}
          </span>
        </div>

        <div className="col-span-8 pl-1">
          <span className="text-[8px] font-bold uppercase text-slate-500 block">
            Especificação / Modelo:
          </span>
          <span className="text-[10px] font-bold text-slate-800 line-clamp-1">
            {model || 'Modelo Padrão'}
          </span>
        </div>

        <div className="col-span-6 border-t border-slate-200 pt-1">
          <span className="text-[8px] font-bold uppercase text-slate-500 block">
            Setor Responsável:
          </span>
          <span className="text-[10px] font-semibold text-slate-700 truncate block">
            {sector || 'Geral / Todos'}
          </span>
        </div>

        <div className="col-span-6 border-t border-slate-200 pt-1">
          <span className="text-[8px] font-bold uppercase text-slate-500 block">
            Localização:
          </span>
          <span className="text-[10px] font-semibold text-slate-700 truncate block">
            {location || 'Sede Principal'}
          </span>
        </div>
      </div>

      {/* Barcode Section (Automated) */}
      <div className="mt-2 pt-1 flex flex-col items-center justify-center bg-white">
        <BarcodeSVG
          value={tag || 'PAT-0001'}
          height={38}
          narrowWidth={1.8}
          wideWidth={4.2}
          showText={true}
        />
      </div>

      {/* Security Warning Footer */}
      <div className="mt-2 pt-1 border-t border-slate-300 text-center">
        <p className="text-[7.5px] font-bold tracking-tight text-slate-600 uppercase">
          ★ ETIQUETA INVIOLÁVEL • LEI 6.404/76 • EM CASO DE DANO AVISE A EQUIPE DE PATRIMÔNIO ★
        </p>
      </div>
    </div>
  );
};
