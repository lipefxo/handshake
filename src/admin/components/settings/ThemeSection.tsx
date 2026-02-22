import type { Proposal, BrandOverrides } from '../../../types/proposal';
import { ThemePicker } from '../../../themes/ThemePicker';
import { ThemeProvider } from '../../../themes/ThemeProvider';
import type { ThemeId } from '../../../themes/themeTypes';
import type { WorkspaceBrandTheme } from '../../../types/workspace';
import { useWorkspaceStore } from '../../../store/workspaceStore';

function MiniPreview({
  themeId,
  brandOverrides,
  workspaceBrandTheme,
}: {
  themeId: ThemeId;
  brandOverrides?: BrandOverrides;
  workspaceBrandTheme?: WorkspaceBrandTheme;
}) {
  return (
    <ThemeProvider
      themeId={themeId}
      brandOverrides={brandOverrides}
      workspaceBrandTheme={workspaceBrandTheme}
      className="w-full rounded-xl overflow-hidden border border-gray-200"
    >
      <div
        className="w-full aspect-video flex flex-col items-center justify-center gap-3 p-6"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        <div
          className="text-xs font-semibold tracking-widest uppercase opacity-60"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Preview
        </div>
        <div
          className="text-2xl font-bold text-center"
          style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}
        >
          Proposal Title
        </div>
        <div
          className="text-sm opacity-70 text-center"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Partner Name
        </div>
        <div
          className="mt-2 px-4 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-bg-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          View Proposal
        </div>
      </div>
    </ThemeProvider>
  );
}

interface ThemeSectionProps {
  proposal: Proposal;
  onImmediateSave: (updates: Partial<Proposal>) => Promise<void>;
}

export function ThemeSection({ proposal, onImmediateSave }: ThemeSectionProps) {
  const workspaceBrandTheme = useWorkspaceStore((state) => state.currentWorkspace?.brandTheme);

  return (
    <section id="theme" className="scroll-mt-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-gray-900">Theme & Brand</h2>
        <p className="text-xs text-gray-400 mt-0.5">Choose a presentation theme.</p>
        <hr className="mt-3 border-gray-100" />
      </div>

      <div className="space-y-6">
        {/* Theme picker */}
        <ThemePicker
          activeThemeId={proposal.themeId}
          workspaceBrandTheme={workspaceBrandTheme}
          onChange={(themeId) => {
            void onImmediateSave({ themeId });
          }}
        />

        {/* Live preview */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Live preview</p>
          <MiniPreview
            themeId={proposal.themeId}
            brandOverrides={proposal.brandOverrides}
            workspaceBrandTheme={workspaceBrandTheme}
          />
        </div>
      </div>
    </section>
  );
}
