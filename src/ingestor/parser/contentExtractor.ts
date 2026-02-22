import type {
  SlideContent,
  SlideLink,
  TitleSlideContent,
  IntroSlideContent,
  StatsSlideContent,
  FeaturesSlideContent,
  TestimonialSlideContent,
  ComparisonSlideContent,
  TimelineSlideContent,
  MediaSlideContent,
  BenefitsSlideContent,
  TableSlideContent,
  ClosingSlideContent,
} from '../../types/proposal';
import type { TypedSection } from './slideTypeInferrer';
import { normalizeIconId } from '../../shared/icons/iconMigration';
import type { AppIconId } from '../../shared/icons/iconRegistry';
import { sanitizeText, validateUrl } from '../../shared/utils/validation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripDirectiveComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_([^\s_](?:.*?[^\s_])?)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1');
}

function cleanText(input: string): string {
  return stripInlineMarkdown(sanitizeText(input)).trim();
}

function extractH1(text: string): string | undefined {
  const match = text.match(/^#\s+(.+)$/m);
  return cleanText(match?.[1] ?? '') || undefined;
}

function extractImage(text: string): { url: string; alt: string } | undefined {
  const match = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!match) return undefined;
  const validated = validateUrl(match[2]);
  return {
    alt: cleanText(match[1]),
    url: validated.isValid ? validated.value : '',
  };
}

function extractParagraphs(text: string): string[] {
  // Remove H1, images, directive comments, and bullet lists
  const cleaned = stripDirectiveComments(text)
    .replace(/^#\s+.+$/m, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/^[-*]\s+.+$/gm, '')
    .trim();

  return cleaned
    .split(/\n{2,}/)
    .map((p) => cleanText(p.replace(/\n/g, ' ').trim()))
    .filter(Boolean);
}

function parsePipeItems(text: string): string[][] {
  const lines = text.split('\n');
  return lines
    .filter((l) => /^[-*]\s+.+/.test(l.trim()))
    .map((l) => l.replace(/^[-*]\s+/, '').split('|').map((s) => s.trim()));
}

function extractPlainBullets(text: string): string[][] {
  const lines = text.split('\n');
  return lines
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+.+/.test(l) && !l.includes('|'))
    .map((l) => [l.replace(/^[-*]\s+/, '').trim()]);
}

export function extractLinks(text: string): SlideLink[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: SlideLink[] = [];
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    // Skip markdown image syntax ![alt](url)
    const prevChar = match.index > 0 ? text[match.index - 1] : '';
    if (prevChar === '!') continue;

    const linkText = sanitizeText(match[1] ?? '');
    const validatedUrl = validateUrl(match[2] ?? '');
    if (!linkText || !validatedUrl.isValid) continue;

    links.push({ text: linkText, url: validatedUrl.value });
  }

  return links;
}

// ---------------------------------------------------------------------------
// Per-type extractors
// ---------------------------------------------------------------------------

function extractTitle(section: TypedSection): TitleSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const rawHeading = cleanText(extractH1(clean) ?? '');
  const headingParts = rawHeading.split(/\s[-|]\s/, 2);
  const headline = cleanText(headingParts[0] ?? '');
  const paragraphs = extractParagraphs(clean);
  const image = extractImage(clean);

  // Look for "Partner × Acme Corp" style line
  const crossLine = clean.match(/^([^#\n!>-][^\n]*(×|x)[^\n]*)$/im);
  const partnerName = cleanText(crossLine?.[1]?.split(/×|x/i)?.[0]?.trim() ?? '');
  const headingSubheadline = cleanText(headingParts[1] ?? '');

  return {
    partnerName,
    headline,
    subheadline: cleanText(paragraphs[0] ?? '') || headingSubheadline,
    partnerLogo: image?.url || undefined,
  };
}

function extractIntro(section: TypedSection): IntroSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const paragraphs = extractParagraphs(clean);
  const image = extractImage(clean);
  const imagePosition = (section.directives['image_position'] as 'left' | 'right') ?? 'right';

  return {
    heading,
    body: cleanText(paragraphs.join('\n\n')),
    image: image?.url || undefined,
    imagePosition,
  };
}

function parseStatValue(raw: string): { value: number; prefix?: string; suffix?: string } {
  let s = raw.trim();
  let prefix: string | undefined;
  let suffix: string | undefined;

  // Detect prefix ($, €, £, ¥)
  const prefixMatch = s.match(/^([$€£¥])/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    s = s.slice(prefix.length);
  }

  // Detect suffix (%,+,K,M,B,/5)
  const suffixMatch = s.match(/(\/5|[%+KMBkmb])$/);
  if (suffixMatch) {
    suffix = suffixMatch[1].toUpperCase();
    s = s.slice(0, s.length - suffixMatch[1].length);
  }

  // Handle commas and decimal
  const num = parseFloat(s.replace(/,/g, ''));

  return { value: isNaN(num) ? 0 : num, prefix, suffix };
}

function extractStats(section: TypedSection): StatsSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const items = parsePipeItems(clean);

  const stats = items.map((parts) => {
    const { value, prefix, suffix } = parseStatValue(cleanText(parts[0] ?? '0'));
    return {
      value,
      prefix,
      suffix,
      label: cleanText(parts[1] ?? ''),
      description: cleanText(parts[2] ?? ''),
    };
  });

  return { heading, stats };
}

function parseIconItem(parts: string[], fallbackIcon: AppIconId): { icon?: AppIconId; title: string; description: string } {
  const raw = parts[0] ?? '';
  const explicitIconMatch = raw.match(/^\[icon:\s*([a-z0-9.-]+)\]\s*/i);
  const explicitIconId = explicitIconMatch?.[1];

  // Legacy leading emoji detection
  const emojiMatch = raw.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
  const emojiIcon = emojiMatch?.[1];

  const title = explicitIconMatch
    ? raw.slice(explicitIconMatch[0].length).trim()
    : (emojiIcon ? raw.slice(emojiMatch![0].length) : raw).trim();

  return {
    icon: normalizeIconId(explicitIconId ?? emojiIcon, fallbackIcon),
    title: cleanText(title),
    description: cleanText(parts[1] ?? ''),
  };
}

function extractFeatures(section: TypedSection): FeaturesSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const paragraphs = extractParagraphs(clean);
  const items = parsePipeItems(clean);
  const normalizedItems = items.length > 0 ? items : extractPlainBullets(clean);

  return {
    heading,
    subheading: cleanText(paragraphs[0] ?? ''),
    features: normalizedItems.map((item) => parseIconItem(item, 'slide.features.default')),
  };
}

function extractBenefits(section: TypedSection): BenefitsSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const items = parsePipeItems(clean);
  const normalizedItems = items.length > 0 ? items : extractPlainBullets(clean);

  return {
    heading,
    benefits: normalizedItems.map((item) => parseIconItem(item, 'slide.benefits.default')),
  };
}

function extractTestimonial(section: TypedSection): TestimonialSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const lines = clean.split('\n').map((l) => l.trim());

  const quoteLines = lines.filter((l) => l.startsWith('> ')).map((l) => l.slice(2));
  const quote = cleanText(quoteLines.join(' '));

  const attributionLine = lines.find((l) => /^[—–-]\s+\w+/.test(l)) ?? '';
  const attrContent = attributionLine.replace(/^[—–-]\s+/, '').trim();

  // "Jane Smith, CFO at Acme Corp"
  const commaIdx = attrContent.indexOf(',');
  const author = cleanText(commaIdx > -1 ? attrContent.slice(0, commaIdx).trim() : attrContent);
  const afterComma = commaIdx > -1 ? attrContent.slice(commaIdx + 1).trim() : '';
  const atIdx = afterComma.toLowerCase().indexOf(' at ');
  const role = cleanText(atIdx > -1 ? afterComma.slice(0, atIdx).trim() : afterComma);
  const company = cleanText(atIdx > -1 ? afterComma.slice(atIdx + 4).trim() : '');

  return { quote, author, role: role || undefined, company: company || undefined };
}

function extractComparison(section: TypedSection): ComparisonSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');

  // Find bold headers
  const boldHeaders = [...clean.matchAll(/^\*\*([^*]+)\*\*/gm)];
  const lines = clean.split('\n');

  function getBulletsUnder(headerLine: string): string[] {
    const startIdx = lines.findIndex((l) => l.includes(headerLine));
    if (startIdx === -1) return [];
    const bullets: string[] = [];
    for (let i = startIdx + 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (/^\*\*[^*]+\*\*/.test(l)) break; // next header
      if (/^[-*]\s+/.test(l)) bullets.push(cleanText(l.replace(/^[-*]\s+/, '')));
    }
    return bullets;
  }

  const before = cleanText(boldHeaders[0]?.[1]?.replace(/:$/, '') ?? 'Before');
  const after = cleanText(boldHeaders[1]?.[1]?.replace(/:$/, '') ?? 'After');

  return {
    heading,
    before: { label: before, items: getBulletsUnder(boldHeaders[0]?.[0] ?? '') },
    after: { label: after, items: getBulletsUnder(boldHeaders[1]?.[0] ?? '') },
  };
}

function extractTimeline(section: TypedSection): TimelineSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const items = parsePipeItems(clean);

  return {
    heading,
    milestones: items.map((parts) => ({
      date: cleanText(parts[0] ?? ''),
      title: cleanText(parts[1] ?? ''),
      description: cleanText(parts[2] ?? ''),
    })),
  };
}

function extractMedia(section: TypedSection): MediaSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const image = extractImage(clean);
  const validatedUrl = validateUrl(image?.url ?? '');
  const url = validatedUrl.isValid ? validatedUrl.value : '';
  const caption = cleanText(image?.alt ?? '');
  const fit = (section.directives['fit'] as 'cover' | 'contain') ?? 'cover';

  let mediaType: 'image' | 'gif' | 'video' = 'image';
  if (/\.gif$/i.test(url)) mediaType = 'gif';
  else if (/\.(mp4|webm)$/i.test(url)) mediaType = 'video';

  return { mediaType, url, caption: caption || undefined, fit };
}

function extractClosing(section: TypedSection): ClosingSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const paragraphs = extractParagraphs(clean);

  // Email pattern
  const emailMatch = clean.match(/\b[\w.+-]+@[\w.-]+\.\w+\b/);
  const emailRaw = emailMatch?.[0];
  // Ensure image URLs don't accidentally match as email
  const contactEmail = emailRaw && !emailRaw.includes('/') ? emailRaw : undefined;

  // Phone pattern
  const phoneMatch = clean.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);

  // CTA link [text](url)
  const linkMatch = clean.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const validatedCtaUrl = validateUrl(linkMatch?.[2] ?? '');

  // Bold name line "**Name** | Role"
  const boldMatch = clean.match(/\*\*([^*]+)\*\*/);

  return {
    heading,
    subheading: cleanText(paragraphs[0] ?? ''),
    contactName: cleanText(boldMatch?.[1] ?? '') || undefined,
    contactEmail: cleanText(contactEmail ?? '') || undefined,
    contactPhone: cleanText(phoneMatch?.[0] ?? '') || undefined,
    ctaText: cleanText(linkMatch?.[1] ?? '') || undefined,
    ctaUrl: validatedCtaUrl.isValid ? validatedCtaUrl.value : undefined,
  };
}

function extractTable(section: TypedSection): TableSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = cleanText(extractH1(clean) ?? '');
  const paragraphs = extractParagraphs(clean);
  const tableLines = clean
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|') && !line.startsWith('#'));

  const parsedRows = tableLines
    .map((line) => {
      const stripped = line.replace(/^\|/, '').replace(/\|$/, '');
      return stripped.split('|').map((cell) => cleanText(cell.trim()));
    })
    .filter((row) => row.length > 0 && row.some(Boolean))
    .filter((row) => !row.every((cell) => /^:?-{3,}:?$/.test(cell)));

  const columns = parsedRows[0] ?? [];
  const rows = parsedRows.slice(1).map((row) =>
    columns.map((_, index) => row[index] ?? ''),
  );

  return {
    heading,
    description: cleanText(paragraphs[0] ?? ''),
    columns,
    rows,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export function extractContent(section: TypedSection): SlideContent {
  switch (section.slideType) {
    case 'title':       return extractTitle(section);
    case 'intro':       return extractIntro(section);
    case 'stats':       return extractStats(section);
    case 'features':    return extractFeatures(section);
    case 'benefits':    return extractBenefits(section);
    case 'testimonial': return extractTestimonial(section);
    case 'comparison':  return extractComparison(section);
    case 'timeline':    return extractTimeline(section);
    case 'media':       return extractMedia(section);
    case 'table':       return extractTable(section);
    case 'closing':     return extractClosing(section);
  }
}
