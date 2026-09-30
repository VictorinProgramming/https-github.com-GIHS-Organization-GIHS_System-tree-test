import React from 'react';
import { GIHSIcon, GIHSIconProps } from './GIHSIcon';

export interface BycompIconProps extends Partial<GIHSIconProps> {
  className?: string;
  size?: number | string;
}

/**
 * @deprecated Use GIHSIcon from './GIHSIcon' instead.
 * Preservado para retrocompatibilidade automática com o novo ícone oficial GIHS System.
 */
export const BycompIcon: React.FC<BycompIconProps> = (props) => {
  return <GIHSIcon variant="system" {...props} />;
};

export default BycompIcon;
