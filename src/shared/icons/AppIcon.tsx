import { HugeiconsIcon } from '@hugeicons/react';
import type { ComponentProps } from 'react';
import { getAppIconById, type AppIconId } from './iconRegistry';

type HugeIconProps = ComponentProps<typeof HugeiconsIcon>;

interface AppIconProps extends Omit<HugeIconProps, 'icon'> {
  icon: string | AppIconId;
  fallbackIcon?: AppIconId;
}

export function AppIcon({ icon, fallbackIcon, strokeWidth = 1.8, color = 'currentColor', ...rest }: AppIconProps) {
  return (
    <HugeiconsIcon
      icon={getAppIconById(icon, fallbackIcon)}
      strokeWidth={strokeWidth}
      color={color}
      {...rest}
    />
  );
}
