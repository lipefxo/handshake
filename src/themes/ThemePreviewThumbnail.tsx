import type { ThemeDefinition } from './themeTypes';

interface ThemePreviewThumbnailProps {
  theme: ThemeDefinition;
  isActive: boolean;
  onClick: () => void;
}

export function ThemePreviewThumbnail({ theme, isActive, onClick }: ThemePreviewThumbnailProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 flex-col items-center gap-1.5 text-left transition-transform hover:scale-[1.02]"
      aria-label={`Select ${theme.name} theme`}
    >
      <div
        className="relative h-16 w-full overflow-hidden border transition-shadow sm:h-20"
        style={{
          borderColor: isActive ? theme.colors.accent : '#e5e7eb',
          borderRadius: theme.style.borderRadius,
          boxShadow: isActive ? `0 0 0 2px ${theme.colors.accentMuted}` : 'none',
          background: theme.colors.bgPrimary,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 75% 20%, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`,
            opacity: theme.style.decorativeOpacity,
          }}
        />
        <div className="relative z-10 p-2.5">
          <div
            className="mb-2 h-1.5 w-2/3 rounded"
            style={{ background: theme.colors.textPrimary, opacity: 0.9 }}
          />
          <div
            className="mb-2 h-1 w-1/2 rounded"
            style={{ background: theme.colors.textSecondary, opacity: 0.8 }}
          />
          <div className="space-y-1">
            <div
              className="h-2.5 rounded"
              style={{ background: theme.colors.bgSecondary, border: `1px solid ${theme.colors.borderLight}` }}
            />
            <div className="flex gap-1">
              <div
                className="h-2 w-1/2 rounded"
                style={{ background: theme.colors.bgSurface, border: `1px solid ${theme.colors.borderLight}` }}
              />
              <div
                className="h-2 w-1/2 rounded"
                style={{ background: theme.colors.bgSurface, border: `1px solid ${theme.colors.borderLight}` }}
              />
            </div>
          </div>
          <div
            className="absolute bottom-2.5 right-2.5 h-2 w-2 rounded-full"
            style={{ background: theme.colors.accent }}
          />
        </div>
      </div>
      <div className="text-center">
        <p
          className={`text-[11px] font-semibold leading-tight ${isActive ? 'text-gray-900' : 'text-gray-500'}`}
        >
          {theme.name}
        </p>
        {isActive && (
          <p className="text-[10px] font-medium text-indigo-600">
            Active
          </p>
        )}
      </div>
    </button>
  );
}
