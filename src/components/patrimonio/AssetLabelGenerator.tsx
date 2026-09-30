import React, { useState, useRef, useEffect } from 'react';
import {
  Tag,
  Printer,
  Sparkles,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Check,
  Building2,
  Cpu,
  Monitor,
  Tv,
  Layers,
  Sliders,
  FileCheck,
  Plus,
  Trash2,
  Copy,
  Download,
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { EquipmentItem, Sector } from '../../types';
import { AssetLabelCard, AssetLabelData } from './AssetLabelCard';
import { SECTORS } from '../../data/mockData';

interface AssetLabelGeneratorProps {
  initialItem?: EquipmentItem | null;
  existingItems?: EquipmentItem[];
  onSaveToInventory?: (newItem: EquipmentItem) => void;
  onClose?: () => void;
}

// Preset equipment types with recommended icons & descriptions
const EQUIPMENT_PRESETS = [
  {
    type: 'Cadeira',
    category: 'Mobiliário',
    models: [
      'Cadeira Ergonômica NR17 Mesh Black (Braços 3D e Apoio Lombar)',
      'Cadeira Presidente em Couro Legítimo com Sistema Relax',
      'Cadeira Giratória Diretor Base Cromada',
      'Cadeira Interlocutor Fixa Pé Sky'
    ]
  },
  {
    type: 'Mesa',
    category: 'Mobiliário',
    models: [
      'Mesa Plataforma 4 Lugares Nogal com Calha de Fiação 2.40m',
      'Mesa de Reunião Oval 10 Lugares com Caixa HDMI/RJ45',
      'Mesa em L Executiva com Gaveteiro Integrado 1.80m',
      'Estação de Trabalho Operacional 2 Lugares com Biombo Acústico'
    ]
  },
  {
    type: 'Computador',
    category: 'Informática',
    models: [
      'Notebook Dell Latitude 5540 Intel Core i7 32GB SSD 1TB',
      'MacBook Pro 16" Apple M3 Max 36GB SSD 1TB Retina',
      'Desktop Lenovo ThinkCentre M70q Tiny Intel i5 16GB',
      'Workstation HP Z4 G5 Xeon 64GB RTX A4000 16GB'
    ]
  },
  {
    type: 'Monitor',
    category: 'Informática',
    models: [
      'Monitor Dell UltraSharp 27" 4K IPS U2723QE Hub USB-C',
      'Monitor LG UltraWide 29" IPS Full HD HDR10 29WP500',
      'Monitor Samsung 24" IPS Full HD 75Hz Ajuste de Altura',
      'Monitor Curvo Samsung Odyssey 34" WQHD 165Hz'
    ]
  },
  {
    type: 'Televisão',
    category: 'Audiovisual',
    models: [
      'Smart TV Samsung Crystal 65" 4K UHD com Suporte Articulado',
      'Smart TV LG 55" NanoCell 4K ThinQ AI com Suporte de Parede',
      'Smart TV Samsung Neo QLED 75" 4K com Soundbar Profissional',
      'Smart TV Sony Bravia 50" 4K Google TV'
    ]
  },
  {
    type: 'Armário',
    category: 'Mobiliário',
    models: [
      'Armário de Aço 2 Portas Reforçado com Chave (4 Prateleiras)',
      'Gaveteiro Volante 3 Gavetas com Rodízios e Chave Escamoteável',
      'Arquivo Deslizante Modular de Alta Densidade (6 Módulos)',
      'Armário Alto Executivo 2 Portas Amadeirado Louro Freijó'
    ]
  },
  {
    type: 'Switch',
    category: 'Rede & Infra',
    models: [
      'Switch Cisco Catalyst 2960X 48P PoE+ 740W Gigabit',
      'Switch Ubiquiti UniFi Enterprise 24 PoE 10G SFP+',
      'Servidor Dell PowerEdge R750 128GB RAM 4x SAS 3.84TB',
      'Nobreak APC Smart-UPS 3000VA 230V Senoidal Rack 2U'
    ]
  },
  {
    type: 'Climatização',
    category: 'Eletro & Escritório',
    models: [
      'Ar-Condicionado Split Inverter Daikin 24.000 BTUs Quente/Frio',
      'Ar-Condicionado Split LG Dual Inverter 18.000 BTUs',
      'Cortina de Ar 1.50m Comercial para Entrada'
    ]
  }
];

export const AssetLabelGenerator: React.FC<AssetLabelGeneratorProps> = ({
  initialItem,
  existingItems = [],
  onSaveToInventory,
  onClose
}) => {
  // 1. Logomarca state
  const [logoType, setLogoType] = useState<'bycomp_default' | 'patrimonio_shield' | 'custom_upload'>('bycomp_default');
  const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
  const [companyName, setCompanyName] = useState('BYCOMP TECNOLOGIA');
  const [subTitle, setSubTitle] = useState('CONTROLE PATRIMONIAL');

  // 2. Tipo do Equipamento state
  const [selectedType, setSelectedType] = useState<string>(initialItem?.type || 'Cadeira');
  const [model, setModel] = useState<string>(
    initialItem?.model || 'Cadeira Ergonômica NR17 Mesh Black (Braços 3D e Apoio Lombar)'
  );
  const [sector, setSector] = useState<string>(initialItem?.sector || 'Financeiro');
  const [location, setLocation] = useState<string>(initialItem?.location || 'Andar 2 • Sala 204');
  const [assignee, setAssignee] = useState<string>(initialItem?.assignee || 'Mariana Castro');

  // 3. Patrimônio automático
  const [tagPrefix, setTagPrefix] = useState('PAT-2026-');
  const [tag, setTag] = useState<string>(initialItem?.tag || '');

  // Print mode and feedback
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [isSaved, setIsSaved] = useState(false);
  const [printLayout, setPrintLayout] = useState<'single_thermal' | 'a4_sheet'>('single_thermal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to generate next sequential patrimony tag
  const generateAutomatedTag = () => {
    // Extract highest existing number from current items
    let maxNum = 28; // starting baseline
    existingItems.forEach((item) => {
      const match = item.tag.match(/(\d+)/g);
      if (match) {
        const lastNum = parseInt(match[match.length - 1], 10);
        if (!isNaN(lastNum) && lastNum > maxNum && lastNum < 9000) {
          maxNum = lastNum;
        }
      }
    });

    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(4, '0');
    return `${tagPrefix}${padded}`;
  };

  // Initialize automated tag on mount if not provided
  useEffect(() => {
    if (!tag) {
      setTag(generateAutomatedTag());
    }
  }, []);

  // Update fields if initialItem changes
  useEffect(() => {
    if (initialItem) {
      setSelectedType(initialItem.type);
      setModel(initialItem.model);
      setTag(initialItem.tag);
      if (initialItem.sector) setSector(initialItem.sector);
      if (initialItem.location) setLocation(initialItem.location);
      if (initialItem.assignee) setAssignee(initialItem.assignee);
    }
  }, [initialItem]);

  // Handle Logo Image Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setCustomLogoUrl(result);
        setLogoType('custom_upload');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Download SVG
  const handleDownloadSVG = () => {
    const svgElement = document.querySelector('.label-preview-container svg');
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `etiqueta_${tag || 'patrimonio'}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Save to inventory
  const handleSaveItem = () => {
    const newItem: EquipmentItem = {
      id: initialItem?.id || `eq-${Date.now()}`,
      tag: tag || generateAutomatedTag(),
      type: selectedType,
      category: (EQUIPMENT_PRESETS.find(p => p.type === selectedType)?.category as any) || 'Mobiliário',
      model,
      sector,
      location,
      assignee,
      status: 'Em uso',
      deliveryDate: new Date().toLocaleDateString('pt-BR')
    };

    if (onSaveToInventory) {
      onSaveToInventory(newItem);
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const labelData: AssetLabelData = {
    tag,
    type: selectedType,
    model,
    sector,
    location,
    assignee,
    companyName,
    subTitle,
    logoType,
    customLogoUrl
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Emissor de Etiquetas de Patrimônio
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Equipe de Patrimônio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Geração automática de código patrimonial, código de barras Code 39 e impressão térmica/A4
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Voltar ao Inventário
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio: Controls (Left) & Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: The 5 Requested Fields */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* FIELD 1: CAMPO PARA COLOCAR UMA LOGOMARCA */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-cyan-800">
                  1
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Logomarca da Empresa</span>
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Impressão no topo da placa
              </span>
            </div>

            {/* Logo Options */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLogoType('bycomp_default')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  logoType === 'bycomp_default'
                    ? 'bg-[#0067FC]/20 border-[#00A6FC] text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-[#0067FC] text-white font-black text-[10px] flex items-center justify-center">
                    GI
                  </div>
                  <span className="text-xs font-bold text-white">GIHS System</span>
                </div>
                <p className="text-[10px] text-slate-500">Padrão corporativo</p>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('patrimonio_shield')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  logoType === 'patrimonio_shield'
                    ? 'bg-amber-950/60 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-amber-600 text-white flex items-center justify-center">
                    <Tag className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-white">Patrimônio</span>
                </div>
                <p className="text-[10px] text-slate-500">Brasão de Ativos</p>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  logoType === 'custom_upload'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center">
                    <Upload className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-white">Personalizada</span>
                </div>
                <p className="text-[10px] text-slate-500">Enviar arquivo</p>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Custom Logo Preview if Uploaded */}
            {logoType === 'custom_upload' && customLogoUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-emerald-800/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <img src={customLogoUrl} alt="Logo" className="h-6 max-w-[80px] object-contain bg-white/10 rounded p-0.5" />
                  <span className="text-emerald-400 font-medium">Logomarca carregada com sucesso</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCustomLogoUrl(''); setLogoType('bycomp_default'); }}
                  className="text-slate-400 hover:text-red-400 transition-colors text-[11px]"
                >
                  Remover
                </button>
              </div>
            )}

            {/* Company & Department Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="BYCOMP TECNOLOGIA"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Subtítulo / Departamento
                </label>
                <input
                  type="text"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="CONTROLE PATRIMONIAL"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* FIELD 2: CAMPO ONDE GERE O TIPO DO EQUIPAMENTO */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-950 text-blue-400 font-mono font-bold text-xs flex items-center justify-center border border-blue-800">
                  2
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>Tipo do Equipamento & Mobiliário</span>
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Mobiliário, TI, Redes & Escritório
              </span>
            </div>

            {/* Quick Type Selection Pills */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Selecione ou Alterne o Tipo de Bem:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EQUIPMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(preset.type);
                      setModel(preset.models[0] || preset.type);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedType === preset.type
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{preset.type}</span>
                    <span className="text-[10px] opacity-60">({preset.category})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model / Description & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Especificação / Modelo Detalhado
                </label>
                <span className="text-[10px] text-slate-500">Aparece na etiqueta física</span>
              </div>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ex: Cadeira Ergonômica NR17 Mesh Black"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              {/* Suggestions from chosen type */}
              {EQUIPMENT_PRESETS.find(p => p.type === selectedType)?.models && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Modelos sugeridos:</span>
                  <div className="flex flex-col gap-1">
                    {EQUIPMENT_PRESETS.find(p => p.type === selectedType)?.models.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModel(m)}
                        className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition-colors truncate cursor-pointer ${
                          model === m
                            ? 'bg-slate-800 border-blue-500/60 text-cyan-300'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        • {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Setor e Localização */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Setor de Destino
                </label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Administrativo">Administrativo</option>
                  <option value="Financeiro">Financeiro & Controladoria</option>
                  <option value="RH">Recursos Humanos (RH)</option>
                  <option value="TI / Infraestrutura">TI & Infraestrutura</option>
                  <option value="N1">Suporte N1</option>
                  <option value="N2">Suporte N2</option>
                  <option value="N3">Suporte N3</option>
                  <option value="Desenvolvimento">Desenvolvimento (Front/Back)</option>
                  <option value="DBA">DBA & Dados</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Comercial">Comercial & Vendas</option>
                  <option value="Diretoria">Diretoria Executiva</option>
                  <option value="Geral">Geral (Salas de Reunião / Auditório)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Localização Exata / Sala
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Andar 2 • Sala 204"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* FIELD 3: CAMPO ONDE GERE AUTOMÁTICO O PATRIMÔNIO */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-950 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-800">
                  3
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Código de Patrimônio (Geração Automática)</span>
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Tombamento oficial
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Prefix Selector */}
                <div className="w-full sm:w-36">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Prefixo:
                  </label>
                  <select
                    value={tagPrefix}
                    onChange={(e) => {
                      setTagPrefix(e.target.value);
                      const currentDigits = tag.replace(/[^0-9]/g, '').slice(-4) || '0029';
                      setTag(`${e.target.value}${currentDigits}`);
                    }}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PAT-2026-">PAT-2026-</option>
                    <option value="PAT-">PAT-</option>
                    <option value="BC-MOB-">BC-MOB- (Mobiliário)</option>
                    <option value="BC-TI-">BC-TI- (TI/Hardware)</option>
                    <option value="BC-ADM-">BC-ADM- (Administrativo)</option>
                  </select>
                </div>

                {/* Patrimony Input */}
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Número do Bem Tombado:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value.toUpperCase())}
                      placeholder="PAT-2026-0029"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm font-bold text-amber-400 placeholder-slate-500 focus:outline-none focus:border-amber-500 tracking-wider"
                    />
                  </div>
                </div>

                {/* Auto Generation Button */}
                <div className="sm:self-end">
                  <button
                    type="button"
                    onClick={() => setTag(generateAutomatedTag())}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 cursor-pointer"
                    title="Gera automaticamente o próximo número de patrimônio sequencial disponível"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gerar Próximo Automático</span>
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300/90 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  O gerador consulta a base de dados de patrimônio e calcula automaticamente o próximo identificador único inviolável.
                </span>
              </div>
            </div>
          </div>

          {/* FIELD 4 & 5: CÓDIGO DE BARRAS AUTOMÁTICO & IMPRESSÃO */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-emerald-800">
                  4 & 5
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Código de Barras & Impressão</span>
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Vetorial Code 39
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Formato de Impressão:
                </label>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="printLayout"
                      checked={printLayout === 'single_thermal'}
                      onChange={() => setPrintLayout('single_thermal')}
                      className="text-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-white block">Etiqueta Individual Térmica</span>
                      <span className="text-[10px] text-slate-500">Impressoras Zebra, Argox, Elgin (75x40mm)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="printLayout"
                      checked={printLayout === 'a4_sheet'}
                      onChange={() => setPrintLayout('a4_sheet')}
                      className="text-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-white block">Folha A4 em Lote (Pimaco)</span>
                      <span className="text-[10px] text-slate-500">Grade com 12 etiquetas para impressora comum</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Ações Rápidas de Impressão & Exportação:
                </label>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Agora (Ctrl + P)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSVG}
                  className="w-full py-2 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Baixar Arquivo Vetorial SVG da Etiqueta</span>
                </button>

                {onSaveToInventory && (
                  <button
                    type="button"
                    onClick={handleSaveItem}
                    className="w-full py-2 px-4 rounded-xl bg-cyan-950 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Salvo no Inventário!' : 'Salvar Bem no Inventário Oficial'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Physical Asset Tag Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6 space-y-4">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Pré-Visualização Real da Placa / Etiqueta
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  75mm x 40mm
                </span>
              </div>

              {/* Tag Preview Box with Metallic/Polyester Look */}
              <div className="p-4 bg-gradient-to-b from-slate-950 to-slate-900 rounded-xl border border-slate-800 flex items-center justify-center min-h-[220px] label-preview-container">
                <AssetLabelCard data={labelData} />
              </div>

              {/* Physical Specifications & Standards */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Padrão do Código:</span>
                  <strong className="font-mono text-white">Code 39 Industrial (1D)</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Material Recomendado:</span>
                  <strong className="text-slate-200">Poliéster Cromo Fosco / Alumínio</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Resistência:</span>
                  <strong className="text-emerald-400">Inviolável com Picote Casca de Ovo</strong>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Setor Emitente:</span>
                  <strong className="text-cyan-400">Equipe de Patrimônio & Ativos</strong>
                </div>
              </div>

              {/* Batch Print Preview Preview */}
              {printLayout === 'a4_sheet' && (
                <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Modo Folha A4 Selecionado
                    </span>
                    <span className="text-[10px] font-mono text-blue-200">12 Etiquetas / Página</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Ao imprimir, o sistema irá duplicar esta etiqueta na grade de 12 posições compatível com folhas adesivas A4 Pimaco 6080/6082.
                  </p>
                </div>
              )}
            </div>

            {/* Quick Helper Note for the Patrimony Team */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Normas de Tombamento de Bens</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                As etiquetas geradas possuem validade perante auditorias fiscais e contábeis internas da GIHS System. Cole a etiqueta em local visível e de baixo desgaste mecânico (ex.: parte inferior do assento, lateral do gabinete ou chassi traseiro de monitores e TVs).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SECTION (Only visible during window.print()) */}
      <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:z-[9999] print:p-0 print:m-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
            }
            @page {
              margin: 4mm;
              size: ${printLayout === 'single_thermal' ? '75mm 45mm' : 'A4'};
            }
          }
        ` }} />

        {printLayout === 'single_thermal' ? (
          <div className="flex items-center justify-center p-2">
            <AssetLabelCard data={labelData} printMode={true} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="border border-dashed border-slate-400 p-1 rounded">
                <AssetLabelCard data={labelData} printMode={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
