export function ExpiredPage() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      <p className="text-6xl mb-6 opacity-20">⏱</p>
      <h1
        className="text-2xl mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        This proposal has expired
      </h1>
      <p
        className="text-sm max-w-sm"
        style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
      >
        The link to this proposal is no longer active. Please contact the sender for an updated link.
      </p>
    </div>
  );
}
