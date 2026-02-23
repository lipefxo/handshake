import type { ProposalVersion } from '../../types/proposal';
import { AppIcon } from '../../shared/icons/AppIcon';
import { formatRelativeTime } from '../../shared/utils/helpers';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VersionDropdownProps {
  versions: ProposalVersion[];
  loading: boolean;
  restoringVersionId: string | null;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: ProposalVersion) => void | Promise<void>;
  resolveUserLabel: (userId?: string) => string;
}

export function VersionDropdown({
  versions,
  loading,
  restoringVersionId,
  onOpenChange,
  onRestore,
  resolveUserLabel,
}: VersionDropdownProps) {
  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 text-xs"
          title="Version history"
        >
          <AppIcon icon="ui.history" className="w-3.5 h-3.5" />
          Versions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs">Version history</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem disabled className="text-xs text-gray-500">
          Current draft
        </DropdownMenuItem>

        {loading && (
          <DropdownMenuItem disabled className="text-xs text-gray-500">
            Loading versions...
          </DropdownMenuItem>
        )}

        {!loading && versions.length === 0 && (
          <DropdownMenuItem disabled className="text-xs text-gray-500">
            No saved versions yet
          </DropdownMenuItem>
        )}

        {!loading && versions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {versions.map((version) => (
              <DropdownMenuItem
                key={version.id}
                className="items-start py-2"
                disabled={restoringVersionId !== null}
                onSelect={(event) => {
                  event.preventDefault();
                  void onRestore(version);
                }}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-900">
                    Version {version.versionNumber}
                    {restoringVersionId === version.id ? ' (Restoring...)' : ''}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {formatRelativeTime(version.createdAt)} by {resolveUserLabel(version.createdBy)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
