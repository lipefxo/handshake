import type {
  SlideContent,
  TitleSlideContent,
  IntroSlideContent,
  StatsSlideContent,
  FeaturesSlideContent,
  TestimonialSlideContent,
  ComparisonSlideContent,
  TimelineSlideContent,
  MediaSlideContent,
  BenefitsSlideContent,
  ClosingSlideContent,
} from '../../types/proposal';
import type { TypedSection } from './slideTypeInferrer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripDirectiveComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function extractH1(text: string): string | undefined {
  const match = text.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function extractImage(text: string): { url: string; alt: string } | undefined {
  const match = text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  if (!match) return undefined;
  return { alt: match[1], url: match[2] };
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
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}

function parsePipeItems(text: string): string[][] {
  const lines = text.split('\n');
  return lines
    .filter((l) => /^[-*]\s+.+/.test(l.trim()))
    .map((l) => l.replace(/^[-*]\s+/, '').split('|').map((s) => s.trim()));
}

// ---------------------------------------------------------------------------
// Per-type extractors
// ---------------------------------------------------------------------------

function extractTitle(section: TypedSection): TitleSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const headline = extractH1(clean) ?? '';
  const paragraphs = extractParagraphs(clean);
  const image = extractImage(clean);

  // Look for "Partner × SecureBags" style line
  const crossLine = clean.match(/^([^#\n!>-][^\n]*(×|x)[^\n]*)$/im);
  const partnerName = crossLine?.[1]?.split(/×|x/i)?.[0]?.trim() ?? '';

  return {
    partnerName,
    headline,
    subheadline: paragraphs[0],
    partnerLogo: image?.url,
  };
}

function extractIntro(section: TypedSection): IntroSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';
  const paragraphs = extractParagraphs(clean);
  const image = extractImage(clean);
  const imagePosition = (section.directives['image_position'] as 'left' | 'right') ?? 'right';

  return {
    heading,
    body: paragraphs.join('\n\n'),
    image: image?.url,
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
  const heading = extractH1(clean);
  const items = parsePipeItems(clean);

  const stats = items.map((parts) => {
    const { value, prefix, suffix } = parseStatValue(parts[0] ?? '0');
    return {
      value,
      prefix,
      suffix,
      label: parts[1] ?? '',
      description: parts[2],
    };
  });

  return { heading, stats };
}

function parseIconItem(parts: string[]): { icon?: string; title: string; description: string } {
  const raw = parts[0] ?? '';
  // Leading emoji detection
  const emojiMatch = raw.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
  const icon = emojiMatch?.[1];
  const title = (icon ? raw.slice(emojiMatch![0].length) : raw).trim();
  return { icon, title, description: parts[1] ?? '' };
}

function extractFeatures(section: TypedSection): FeaturesSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';
  const paragraphs = extractParagraphs(clean);
  const items = parsePipeItems(clean);

  return {
    heading,
    subheading: paragraphs[0],
    features: items.map(parseIconItem),
  };
}

function extractBenefits(section: TypedSection): BenefitsSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';
  const items = parsePipeItems(clean);

  return {
    heading,
    benefits: items.map(parseIconItem),
  };
}

function extractTestimonial(section: TypedSection): TestimonialSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const lines = clean.split('\n').map((l) => l.trim());

  const quoteLines = lines.filter((l) => l.startsWith('> ')).map((l) => l.slice(2));
  const quote = quoteLines.join(' ');

  const attributionLine = lines.find((l) => /^[—–-]\s+\w+/.test(l)) ?? '';
  const attrContent = attributionLine.replace(/^[—–-]\s+/, '').trim();

  // "Jane Smith, CFO at Acme Corp"
  const commaIdx = attrContent.indexOf(',');
  const author = commaIdx > -1 ? attrContent.slice(0, commaIdx).trim() : attrContent;
  const afterComma = commaIdx > -1 ? attrContent.slice(commaIdx + 1).trim() : '';
  const atIdx = afterComma.toLowerCase().indexOf(' at ');
  const role = atIdx > -1 ? afterComma.slice(0, atIdx).trim() : afterComma;
  const company = atIdx > -1 ? afterComma.slice(atIdx + 4).trim() : '';

  return { quote, author, role: role || undefined, company: company || undefined };
}

function extractComparison(section: TypedSection): ComparisonSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';

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
      if (/^[-*]\s+/.test(l)) bullets.push(l.replace(/^[-*]\s+/, ''));
    }
    return bullets;
  }

  const before = boldHeaders[0]?.[1]?.replace(/:$/, '') ?? 'Before';
  const after = boldHeaders[1]?.[1]?.replace(/:$/, '') ?? 'After';

  return {
    heading,
    before: { label: before, items: getBulletsUnder(boldHeaders[0]?.[0] ?? '') },
    after: { label: after, items: getBulletsUnder(boldHeaders[1]?.[0] ?? '') },
  };
}

function extractTimeline(section: TypedSection): TimelineSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';
  const items = parsePipeItems(clean);

  return {
    heading,
    milestones: items.map((parts) => ({
      date: parts[0] ?? '',
      title: parts[1] ?? '',
      description: parts[2],
    })),
  };
}

function extractMedia(section: TypedSection): MediaSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const image = extractImage(clean);
  const url = image?.url ?? '';
  const caption = image?.alt;
  const fit = (section.directives['fit'] as 'cover' | 'contain') ?? 'cover';

  let mediaType: 'image' | 'gif' | 'video' = 'image';
  if (/\.gif$/i.test(url)) mediaType = 'gif';
  else if (/\.(mp4|webm)$/i.test(url)) mediaType = 'video';

  return { mediaType, url, caption, fit };
}

function extractClosing(section: TypedSection): ClosingSlideContent {
  const clean = stripDirectiveComments(section.raw);
  const heading = extractH1(clean) ?? '';
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

  // Bold name line "**Name** | Role"
  const boldMatch = clean.match(/\*\*([^*]+)\*\*/);

  return {
    heading,
    subheading: paragraphs[0],
    contactName: boldMatch?.[1],
    contactEmail,
    contactPhone: phoneMatch?.[0],
    ctaText: linkMatch?.[1],
    ctaUrl: linkMatch?.[2],
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
    case 'closing':     return extractClosing(section);
  }
}
