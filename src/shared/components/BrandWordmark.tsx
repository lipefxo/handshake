import type { SVGProps } from 'react';

interface BrandWordmarkProps extends SVGProps<SVGSVGElement> {
  variant?: 'light' | 'dark' | 'current';
}

export function BrandWordmark({ variant = 'light', style, ...props }: BrandWordmarkProps) {
  const color =
    variant === 'current'
      ? 'currentColor'
      : variant === 'dark'
      ? 'var(--color-brand-wordmark-on-dark)'
      : 'var(--color-brand-wordmark)';

  return (
    <svg
      viewBox="0 0 726 99"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ color, ...style }}
      {...props}
    >
      <text
        x="2"
        y="72"
        fill="currentColor"
        fontFamily="Space Grotesk, Inter Tight, system-ui, sans-serif"
        fontSize="74"
        fontWeight="600"
        letterSpacing="-4.2"
      >
        Handshake
      </text>
    </svg>
  );
}
