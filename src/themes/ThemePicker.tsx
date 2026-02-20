import { themeIds, themes } from './themeDefinitions';
import type { ThemeId } from './themeTypes';
import { ThemePreviewThumbnail } from './ThemePreviewThumbnail';

interface ThemePickerProps {
  activeThemeId: ThemeId;
  onChange: (themeId: ThemeId) => void;
}

export function ThemePicker({ activeThemeId, onChange }: ThemePickerProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Theme
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {themeIds.map((themeId) => (
          <ThemePreviewThumbnail
            key={themeId}
            theme={themes[themeId]}
            isActive={activeThemeId === themeId}
            onClick={() => onChange(themeId)}
          />
        ))}
      </div>
    </div>
  );
}
