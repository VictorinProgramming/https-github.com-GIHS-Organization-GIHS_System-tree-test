import React from 'react';
import { useSystemLogo } from '../hooks/useSystemLogo';

export interface GIHSIconProps {
  className?: string;
  size?: number | string;
  variant?: 'system' | 'agents';
  mode?: 'dark' | 'light' | 'transparent';
}

export const GIHSIcon: React.FC<GIHSIconProps> = ({
  className = 'w-8 h-8',
  size,
  variant = 'system',
  mode = 'transparent'
}) => {
  const { logoData } = useSystemLogo();
  const isAgents = variant === 'agents';
  const isLight = mode === 'light';

  if (logoData?.logo_url && logoData.logo_url !== '/gihs-logo.svg') {
    return (
      <img
        src={logoData.logo_url}
        alt={logoData.title || "GIHS SYSTEMS"}
        className={`object-contain ${className}`}
        style={size ? { width: size, height: size } : undefined}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GIHS SYSTEMS Official Icon"
    >
      <defs>
        <linearGradient id="gihsIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0067FC" />
          <stop offset="50%" stopColor="#00A6FC" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>

        <linearGradient id="gihsIconBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#00A6FC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0067FC" stopOpacity="0.3" />
        </linearGradient>

        <radialGradient id="iconEmblemBgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#08285C" />
          <stop offset="70%" stopColor="#020E24" />
          <stop offset="100%" stopColor="#010816" />
        </radialGradient>

        <filter id="iconGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Escudo Oficial GIHS SYSTEMS */}
      <g transform="translate(6, 6)">
        {/* Silhueta Externa do Escudo com Gradiente Iluminado */}
        <path
          d="M 44 4 L 78 18 L 78 56 C 78 72 44 88 44 88 C 44 88 10 72 10 56 L 10 18 Z"
          fill={isLight ? '#01122D' : 'url(#iconEmblemBgGrad)'}
          stroke="url(#gihsIconBorder)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Linhas de circuito internas de precisão */}
        <path
          d="M 44 14 L 68 24 L 68 52 C 68 64 44 76 44 76 C 44 76 20 64 20 52 L 20 24 Z"
          fill="none"
          stroke="#00A6FC"
          strokeWidth="1.2"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
        />

        {/* Monograma Geométrico Central GIHS com Gradiente Elétrico */}
        <path
          d="M 58 32 L 34 32 C 30 32 27 35 27 39 L 27 55 C 27 59 30 62 34 62 L 56 62 C 60 62 63 59 63 55 L 63 46 L 45 46 L 45 51 L 55 51 L 55 54 L 35 54 L 35 40 L 58 40 Z"
          fill="url(#gihsIconGradient)"
        />

        {/* Detalhes luminosos e nós cibernéticos */}
        <circle cx="63" cy="46" r="3.5" fill="#00E5FF" filter="url(#iconGlow)" />
        <circle cx="34" cy="32" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="56" cy="62" r="2.5" fill="#00E5FF" />
        <circle cx="44" cy="22" r="2" fill="#00A6FC" />

        {/* Detalhe IA se for agents */}
        {isAgents && (
          <path
            d="M 68 18 L 74 12 M 74 18 L 68 12"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
};
