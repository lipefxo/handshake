import type { SlideType } from '../../types/proposal';
import type { RawSection } from './sectionDetector';

export interface TypedSection extends RawSection {
  slideType: SlideType;
  directives: Record<string, string>;
  confidence: 'explicit' | 'inferred';
}

const VALID_TYPES: Set<SlideType> = new Set([
  'title', 'intro', 'stats', 'features', 'testimonial',
  'comparison', 'timeline', 'media', 'benefits', 'bullet-list', 'table', 'closing',
]);

function parseDirectives(raw: string): Record<string, string> {
  const directives: Record<string, string> = {};
  // Match <!-- key: value, key2: value2 --> style comments
  const commentRegex = /<!--([\s\S]*?)-->/g;
  let match;
  while ((match = commentRegex.exec(raw)) !== null) {
    const inner = match[1];
    // Split on commas that are not inside values
    const pairs = inner.split(',');
    for (const pair of pairs) {
      const kv = pair.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/);
      if (kv) {
        directives[kv[1].trim()] = kv[2].trim();
      }
    }
  }
  return directives;
}

function inferTypeFromContent(
  raw: string,
  sectionIndex: number,
  _totalSections: number,
  isLast: boolean,
): SlideType {
  const lines = raw.split('\n').map((l) => l.trim());
  const heading = lines.find((l) => l.startsWith('#'))?.toLowerCase() ?? '';
  const headingText = heading.replace(/^#+\s+/, '');
  const text = raw.toLowerCase();

  // Only image content → media
  const withoutComments = raw.replace(/<!--[\s\S]*?-->/g, '').trim();
  const withoutImages = withoutComments.replace(/!\[.*?\]\(.*?\)/g, '').trim();
  if (/!\[.*?\]\(.*?\)/.test(withoutComments) && !withoutImages) {
    return 'media';
  }

  // Blockquote followed by attribution → testimonial
  if (/^>\s+/m.test(raw) && /^[—–-]\s+\w+/m.test(raw)) {
    return 'testimonial';
  }

  // Heading-first inference for plain text / light-markup sources.
  if (/(executive summary)/i.test(headingText) && sectionIndex === 0) {
    return 'title';
  }
  if (/(program structure|investment|pricing menu|pricing table|cost breakdown|budget)/i.test(headingText)) {
    return 'table';
  }
  if (/(partnership roadmap|roadmap|timeline|milestone|journey)/i.test(headingText)) {
    return 'timeline';
  }
  if (/(key value proposition|value proposition|what .* gets|partner benefit|benefit)/i.test(headingText)) {
    return 'benefits';
  }
  if (/(why now|opportunity|overview|about|portfolio intelligence|data network effects)/i.test(headingText)) {
    return 'intro';
  }
  if (/(solution|capabilities|what we offer|proof points|partnership.*impact)/i.test(headingText)) {
    return 'features';
  }
  if (sectionIndex === 0) {
    return 'title';
  }

  // Bullet items with | where first segment has numbers/currency → stats
  const bulletPipeLines = lines.filter((l) => /^[-*]\s+.+\|.+/.test(l));
  if (bulletPipeLines.length >= 2) {
    const firstSegments = bulletPipeLines.map((l) => l.replace(/^[-*]\s+/, '').split('|')[0].trim());
    const numericCount = firstSegments.filter((s) => /[\d$€£¥%.]/.test(s)).length;
    if (numericCount / firstSegments.length >= 0.5) {
      return 'stats';
    }
  }

  // Bold headers with before/after patterns → comparison
  if (/\*\*(before|without|current)[^*]*\*\*/i.test(raw) && /\*\*(after|with|proposed)[^*]*\*\*/i.test(raw)) {
    return 'comparison';
  }

  // Bullet items with date/quarter patterns and | separators → timeline
  if (bulletPipeLines.length >= 2) {
    const datePatterns = /\b(Q[1-4]\s*\d{4}|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
    const firstSegments = bulletPipeLines.map((l) => l.replace(/^[-*]\s+/, '').split('|')[0].trim());
    if (firstSegments.filter((s) => datePatterns.test(s)).length >= 2) {
      return 'timeline';
    }
  }

  // Bullet items with | separators (non-numeric) → features or benefits
  if (bulletPipeLines.length >= 2) {
    if (/benefit|what you get|partner perk/i.test(heading + text.slice(0, 200))) {
      return 'benefits';
    }
    return 'features';
  }

  // Heading keyword matching for numeric/stat-heavy sections.
  if (/(pricing|cost|investment|budget|by the numbers|metrics)/i.test(heading)) {
    return 'stats';
  }

  // Plain bullet lists (without pipe separators) are often features/benefits.
  const plainBullets = lines.filter((l) => /^[-*]\s+.+/.test(l) && !l.includes('|'));
  if (plainBullets.length >= 2) {
    const numericLead = plainBullets.filter((line) =>
      /^[-*]\s*[$€£¥]?\d/i.test(line) || /^[-*]\s*(founded|network of)\s+\d/i.test(line),
    ).length;
    if (
      numericLead / plainBullets.length >= 0.5 &&
      /(overview|by the numbers|metrics|stat|impact|cost|pricing|investment)/i.test(heading + text.slice(0, 300))
    ) {
      return 'stats';
    }

    const timelineLead = plainBullets.filter((line) =>
      /^[-*]\s*(q[1-4]\s*\d{4}|\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(line),
    ).length;
    if (timelineLead >= 2) {
      return 'timeline';
    }
  }

  if (plainBullets.length >= 3) {
    if (/(key points|highlights|agenda|takeaways|checklist)/i.test(heading + text)) {
      return 'bullet-list';
    }
    if (/(offer|feature|include|provide|visibility|reporting|dashboard)/i.test(heading)) {
      return 'features';
    }
    if (/(benefit|gain|receive|access|what you get|community gains|your .* gains|why this matters)/i.test(heading + text)) {
      return 'benefits';
    }
    if (/(offer|feature|include|provide|visibility|reporting|dashboard)/i.test(text)) {
      return 'features';
    }
    return 'features';
  }

  // Last section with contact info or CTA language → closing
  if (isLast && /(@[\w.]+\.|schedule|call|contact|mailto|let's|together|redefine|future|ready to|get started|next step|build that)/i.test(text)) {
    return 'closing';
  }

  return 'intro';
}

export function inferSlideType(
  section: RawSection,
  sectionIndex: number,
  totalSections: number,
): TypedSection {
  const directives = parseDirectives(section.raw);
  const explicitType = directives['type'];

  if (explicitType && VALID_TYPES.has(explicitType as SlideType)) {
    return {
      ...section,
      slideType: explicitType as SlideType,
      directives,
      confidence: 'explicit',
    };
  }

  const isLast = sectionIndex === totalSections - 1;
  const slideType = inferTypeFromContent(section.raw, sectionIndex, totalSections, isLast);

  return {
    ...section,
    slideType,
    directives: explicitType ? { ...directives, _unknownType: explicitType } : directives,
    confidence: 'inferred',
  };
}
