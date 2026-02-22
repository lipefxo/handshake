import { useEffect, useRef, useState } from 'react';

const defaultSections = [
  { id: 'general', label: 'General' },
  { id: 'theme', label: 'Theme & Brand' },
  { id: 'sharing', label: 'Sharing' },
  { id: 'danger', label: 'Danger Zone' },
];

interface SettingsNavProps {
  sections?: Array<{ id: string; label: string }>;
}

export function SettingsNav({ sections = defaultSections }: SettingsNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setActiveId(sections[0]?.id ?? '');
  }, [sections]);

  useEffect(() => {
    const sectionEls = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first section whose top is in view
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const first = visible.reduce((a, b) =>
            (a.boundingClientRect.top ?? 0) < (b.boundingClientRect.top ?? 0) ? a : b
          );
          setActiveId(first.target.id);
        }
      },
      { threshold: 0.3 }
    );

    sectionEls.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop: sticky left sidebar */}
      <nav className="hidden md:flex flex-col gap-0.5 sticky top-6 self-start h-fit">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={`px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
              activeId === s.id
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            } ${s.id === 'danger' ? (activeId === s.id ? 'text-red-700 bg-red-50' : 'text-red-500 hover:text-red-700 hover:bg-red-50') : ''}`}
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* Mobile: horizontal scrollable strip */}
      <div className="md:hidden flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-gray-100">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors duration-150 ${
              activeId === s.id
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            } ${s.id === 'danger' ? (activeId === s.id ? 'text-red-700 bg-red-50' : 'text-red-500') : ''}`}
          >
            {s.label}
          </a>
        ))}
      </div>
    </>
  );
}
