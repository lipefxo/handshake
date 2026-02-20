import { useState } from 'react';

const GUIDE_SECTIONS = [
  {
    type: 'title',
    label: 'Title',
    example: `# Your Headline
<!-- type: title -->
Partner × SecureBags

Subheadline here.`,
  },
  {
    type: 'intro',
    label: 'Intro',
    example: `# Section Heading
<!-- type: intro, image_position: right -->

Body text goes here.

![Alt](https://example.com/img.jpg)`,
  },
  {
    type: 'stats',
    label: 'Stats',
    example: `# Key Metrics
<!-- type: stats -->

- $2.5B | Total assets managed
- 250+ | Active customers
- 99.9% | Platform uptime`,
  },
  {
    type: 'features',
    label: 'Features',
    example: `# Key Features
<!-- type: features -->

- 🎯 Feature | Description
- 🔒 Security | Description`,
  },
  {
    type: 'benefits',
    label: 'Benefits',
    example: `# Partner Benefits
<!-- type: benefits -->

- 💰 Revenue Share | 15% commission
- 🎯 Co-Marketing | Joint campaigns`,
  },
  {
    type: 'testimonial',
    label: 'Testimonial',
    example: `# What Partners Say
<!-- type: testimonial -->

> "Quote text here."

— Name, Role at Company`,
  },
  {
    type: 'comparison',
    label: 'Comparison',
    example: `# Before & After
<!-- type: comparison -->

**Without us:**
- Problem one

**With us:**
- Solution one`,
  },
  {
    type: 'timeline',
    label: 'Timeline',
    example: `# Roadmap
<!-- type: timeline -->

- Q1 2026 | Phase One | Description
- Q2 2026 | Phase Two | Description`,
  },
  {
    type: 'media',
    label: 'Media',
    example: `![Caption](https://example.com/img.gif)
<!-- type: media, fit: cover -->`,
  },
  {
    type: 'closing',
    label: 'Closing',
    example: `# Let's Get Started
<!-- type: closing -->

**Sarah Johnson** | Partnerships
sarah@company.com | (555) 123-4567

[Schedule a Call](https://calendly.com/...)`,
  },
];

export function IngestorFormatGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors group"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Format guide
        <span className="text-gray-300 ml-auto font-normal">10 slide types</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          {GUIDE_SECTIONS.map((section) => (
            <div key={section.type} className="rounded-lg border border-gray-100 bg-gray-50 overflow-hidden">
              <div className="px-3 py-1.5 border-b border-gray-100 bg-white">
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  {section.label}
                </span>
              </div>
              <pre
                className="text-[10px] leading-relaxed text-gray-500 px-3 py-2 overflow-x-auto whitespace-pre-wrap"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              >
                {section.example}
              </pre>
            </div>
          ))}
          <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-[11px] text-blue-600">
            <span className="font-semibold">Tip:</span> Separate slides with <code className="bg-blue-100 px-1 rounded font-mono">---</code> horizontal rules. Add a frontmatter block at the top with <code className="bg-blue-100 px-1 rounded font-mono">title:</code>, <code className="bg-blue-100 px-1 rounded font-mono">partner:</code>, and <code className="bg-blue-100 px-1 rounded font-mono">date:</code> fields.
          </div>
        </div>
      )}
    </div>
  );
}
