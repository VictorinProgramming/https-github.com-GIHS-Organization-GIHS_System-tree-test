import React from 'react';
import { GIHSLogo, GIHSLogoProps } from './GIHSLogo';

export interface BycompLogoProps extends Partial<GIHSLogoProps> {
  className?: string;
  height?: number | string;
  showTagline?: boolean;
}

/**
 * @deprecated Use GIHSLogo from './GIHSLogo' instead.
 * Preservado para retrocompatibilidade automática com a nova identidade oficial GIHS System.
 */
export const BycompLogo: React.FC<BycompLogoProps> = (props) => {
  return <GIHSLogo variant="system" {...props} />;
};

export default BycompLogo;
