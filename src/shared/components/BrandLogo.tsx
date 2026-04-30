import type { SVGProps } from 'react';

interface BrandLogoProps extends SVGProps<SVGSVGElement> {
  variant?: 'light' | 'dark' | 'current';
}

export function BrandLogo({ variant = 'light', style, ...props }: BrandLogoProps) {
  const color =
    variant === 'current'
      ? 'currentColor'
      : variant === 'dark'
      ? 'var(--color-brand-logo-on-dark)'
      : 'var(--color-brand-logo-accent)';

  return (
    <svg
      viewBox="0 0 640 640"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      style={{ color, ...style }}
      {...props}
    >
      <rect x="120" y="116" width="140" height="408" rx="68" fill="currentColor" opacity="0.18" />
      <rect x="380" y="116" width="140" height="408" rx="68" fill="currentColor" opacity="0.18" />
      <rect x="150" y="146" width="80" height="348" rx="40" fill="currentColor" />
      <rect x="410" y="146" width="80" height="348" rx="40" fill="currentColor" />
      <rect x="214" y="272" width="212" height="96" rx="48" fill="currentColor" />
      <rect x="214" y="236" width="212" height="24" rx="12" fill="currentColor" opacity="0.28" />
      <rect x="214" y="380" width="212" height="24" rx="12" fill="currentColor" opacity="0.28" />
    </svg>
  );
}
