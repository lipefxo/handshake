import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useProposalStore } from '../store/proposalStore';

export function ShortCodeRedirect() {
  const { code } = useParams<{ code: string }>();
  const { getProposalMetaByShortCode } = useProposalStore();
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveShortCode = async () => {
      if (!code) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      const proposal = await getProposalMetaByShortCode(code);
      if (cancelled) return;

      if (!proposal) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setTargetSlug(proposal.slug);
      setIsLoading(false);
    };

    void resolveShortCode();

    return () => {
      cancelled = true;
    };
  }, [code, getProposalMetaByShortCode]);

  if (targetSlug) {
    return <Navigate to={`/p/${targetSlug}`} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-white">
        <h1 className="text-2xl font-semibold text-gray-900">Link not found</h1>
        <p className="mt-2 text-sm text-gray-500">
          This shared link may have expired, been unpublished, or is invalid.
        </p>
      </div>
    );
  }

  return null;
}
