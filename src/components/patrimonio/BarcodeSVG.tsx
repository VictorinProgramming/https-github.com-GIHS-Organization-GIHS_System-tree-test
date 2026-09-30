import React from 'react';

// Code 39 standard barcode table (9 elements: 5 bars, 4 spaces. 0 = narrow, 1 = wide)
const CODE39_ENCODING: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100'
};

interface BarcodeSVGProps {
  value: string;
  height?: number;
  narrowWidth?: number;
  wideWidth?: number;
  showText?: boolean;
  className?: string;
  color?: string;
}

export const BarcodeSVG: React.FC<BarcodeSVGProps> = ({
  value,
  height = 50,
  narrowWidth = 2,
  wideWidth = 5,
  showText = true,
  className = '',
  color = '#000000'
}) => {
  // Normalize input: uppercase, allowed characters only
  const cleanStr = (value || 'PAT-0001')
    .toUpperCase()
    .replace(/[^A-Z0-9\-\.\ \$\/\+\%]/g, '');

  const fullCode = `*${cleanStr}*`;

  // Build the list of bars and spaces
  const elements: { isBar: boolean; width: number }[] = [];

  for (let i = 0; i < fullCode.length; i++) {
    const char = fullCode[i];
    const pattern = CODE39_ENCODING[char] || CODE39_ENCODING['-'];

    // 9 elements: alternating bar, space, bar, space...
    for (let p = 0; p < 9; p++) {
      const isBar = p % 2 === 0;
      const isWide = pattern[p] === '1';
      const width = isWide ? wideWidth : narrowWidth;
      elements.push({ isBar, width });
    }

    // Inter-character gap (narrow space)
    if (i < fullCode.length - 1) {
      elements.push({ isBar: false, width: narrowWidth });
    }
  }

  // Calculate total width
  const totalWidth = elements.reduce((acc, el) => acc + el.width, 0) + 20; // 10px quiet zone each side
  let currentX = 10;

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        width="100%"
        height={height}
        className="max-w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <rect width={totalWidth} height={height} fill="#FFFFFF" />
        {elements.map((el, idx) => {
          const x = currentX;
          currentX += el.width;
          if (!el.isBar) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={el.width}
              height={height}
              fill={color}
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] tracking-[0.25em] font-bold text-slate-900 mt-1 uppercase">
          *{cleanStr}*
        </span>
      )}
    </div>
  );
};
