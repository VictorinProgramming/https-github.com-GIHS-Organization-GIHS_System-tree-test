import React from 'react';
import { useSystemLogo } from '../hooks/useSystemLogo';

export interface GIHSLogoProps {
  variant?: 'system' | 'agents';
  mode?: 'dark' | 'light' | 'transparent';
  className?: string;
  height?: number | string;
  showTagline?: boolean;
}

export const GIHSLogo: React.FC<GIHSLogoProps> = ({
  variant = 'system',
  mode = 'transparent',
  className = 'h-9 w-auto',
  height,
  showTagline = true
}) => {
  const { logoData } = useSystemLogo();
  const isAgents = variant === 'agents';
  const isLight = mode === 'light';

  // Primary colors
  const primaryTextColor = isLight ? '#01122D' : '#FFFFFF';
  
  // Tagline color: exactly matching the logo's cyan/electric blue
  const cyanColor = logoData?.tagline_color || '#00A6FC';
  const displayTagline = isAgents 
    ? 'AUTONOMOUS INTELLIGENCE & BUSINESS AGENTS'
    : (logoData?.tagline || 'Enterprise System . 100% Monitorado');

  // If a custom uploaded image/base64 was saved in PostgreSQL (other than the official vector SVG)
  if (logoData?.logo_url && logoData.logo_url !== '/gihs-logo.svg') {
    return (
      <div 
        className={`inline-flex flex-col items-start select-none ${className}`}
        style={height ? { height: 'auto', maxHeight: height } : undefined}
      >
        <img
          src={logoData.logo_url}
          alt={logoData.title || "GIHS SYSTEMS"}
          className="object-contain"
          style={{ height: height || 40, width: 'auto' }}
        />
        {showTagline && (
          <span 
            className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase mt-1 block"
            style={{ color: cyanColor }}
          >
            {displayTagline}
          </span>
        )}
      </div>
    );
  }

  // Official high-tech vector logo: GIHS SYSTEMS
  return (
    <svg
      viewBox="0 0 460 100"
      className={className}
      style={height ? { height, width: 'auto' } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={isAgents ? "GIHS Agents" : "GIHS SYSTEMS"}
    >
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=JetBrains+Mono:wght@700&display=swap');
          .gihs-title {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            font-weight: 900;
          }
          .gihs-systems {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            font-weight: 800;
            letter-spacing: 0.12em;
          }
          .gihs-tagline {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            font-weight: 700;
            letter-spacing: 0.14em;
          }
        `}</style>

        {/* Gradiente Oficial GIHS SYSTEMS: #0067FC -> #0088FC -> #00D2FF */}
        <linearGradient id="gihsSystemsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0067FC" />
          <stop offset="50%" stopColor="#00A6FC" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>

        <linearGradient id="gihsEmblemBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0067FC" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="gihsLetterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>

        <radialGradient id="emblemBgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#08285C" />
          <stop offset="70%" stopColor="#020E24" />
          <stop offset="100%" stopColor="#010816" />
        </radialGradient>

        <filter id="gihsSystemsGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Emblema Cyber Shield Oficial GIHS SYSTEMS */}
      <g transform="translate(10, 6)">
        {/* Silhueta Externa do Escudo com Gradiente Iluminado */}
        <path
          d="M 42 4 L 76 18 L 76 54 C 76 70 42 84 42 84 C 42 84 8 70 8 54 L 8 18 Z"
          fill={isLight ? '#01122D' : 'url(#emblemBgGrad)'}
          stroke="url(#gihsEmblemBorder)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Linhas de circuito internas de precisão */}
        <path
          d="M 42 13 L 66 23 L 66 50 C 66 62 42 74 42 74 C 42 74 18 62 18 50 L 18 23 Z"
          fill="none"
          stroke="#00A6FC"
          strokeWidth="1.2"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
        />

        {/* Monograma Geométrico Central GIHS com Gradiente Elétrico */}
        <path
          d="M 56 30 L 32 30 C 28 30 25 33 25 37 L 25 53 C 25 57 28 60 32 60 L 54 60 C 58 60 61 57 61 53 L 61 44 L 43 44 L 43 49 L 53 49 L 53 52 L 33 52 L 33 38 L 56 38 Z"
          fill="url(#gihsSystemsGradient)"
        />

        {/* Detalhes luminosos e nós cibernéticos */}
        <circle cx="61" cy="44" r="3.5" fill="#00E5FF" filter="url(#gihsSystemsGlow)" />
        <circle cx="32" cy="30" r="2.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="54" cy="60" r="2.5" fill="#00E5FF" />
        <circle cx="42" cy="20" r="2" fill="#00A6FC" />

        {/* Ícone de status de agente ou sistema */}
        {isAgents && (
          <path
            d="M 66 16 L 72 10 M 72 16 L 66 10"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </g>

      {/* Marca Principal: GIHS */}
      <text
        x="112"
        y="58"
        fontSize="48"
        fill={primaryTextColor}
        className="gihs-title"
        letterSpacing="0.02em"
      >
        GIHS
      </text>

      {/* Submarca da Logo: SYSTEMS (na cor ciano com gradiente vibrante) */}
      <text
        x="236"
        y="58"
        fontSize="44"
        fill="url(#gihsSystemsGradient)"
        className="gihs-systems"
      >
        {isAgents ? 'AGENTS' : 'SYSTEMS'}
      </text>

      {/* Tagline Corporativa Oficial: abaixo da logo, na mesma cor da logo */}
      {showTagline && (
        <g transform="translate(114, 82)">
          <text
            x="0"
            y="0"
            fontSize="11"
            fill={cyanColor}
            className="gihs-tagline"
          >
            {displayTagline}
          </text>
        </g>
      )}
    </svg>
  );
};

export default GIHSLogo;
