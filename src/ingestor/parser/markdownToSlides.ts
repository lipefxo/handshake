import { v4 as generateUUID } from 'uuid';
import type { SlideConfig } from '../../types/proposal';
import { detectSections, parseFrontmatter } from './sectionDetector';
import { inferSlideType } from './slideTypeInferrer';
import { extractContent } from './contentExtractor';
import { validateSlides } from './validationLayer';
import type { ValidationResult } from './validationLayer';

export interface ParseResult {
  frontmatter: {
    title?: string;
    partner?: string;
    date?: string;
    theme?: string;
  };
  slides: SlideConfig[];
  validation: ValidationResult[];
  errors: string[];
}

export function markdownToSlides(markdown: string): ParseResult {
  const errors: string[] = [];

  if (!markdown.trim()) {
    return { frontmatter: {}, slides: [], validation: [], errors: ['No markdown content provided.'] };
  }

  // Step 1: Detect sections
  const sections = detectSections(markdown);

  // Step 2: Extract frontmatter
  const fmRaw = parseFrontmatter(sections);
  const frontmatter = {
    title: fmRaw['title'],
    partner: fmRaw['partner'],
    date: fmRaw['date'],
    theme: fmRaw['theme'],
  };

  // Step 3: Filter to content sections
  const contentSections = sections.filter((s) => !s.isFrontmatter);

  if (contentSections.length === 0) {
    errors.push('No slides detected. Add content sections separated by --- horizontal rules.');
    return { frontmatter, slides: [], validation: [], errors };
  }

  // Step 4: Infer types
  const typedSections = contentSections.map((s, i) =>
    inferSlideType(s, i, contentSections.length)
  );

  // Step 5: Check for unknown type directives
  typedSections.forEach((ts) => {
    if (ts.directives['_unknownType']) {
      errors.push(`Unknown slide type directive "type: ${ts.directives['_unknownType']}" in section ${ts.index + 1}. Valid types: title, intro, stats, features, benefits, testimonial, comparison, timeline, media, closing.`);
    }
  });

  // Step 6: Extract content
  const slides: SlideConfig[] = typedSections.map((section) => {
    const content = extractContent(section);

    // Auto-fix image URLs without protocol
    fixImageUrls(content);

    return {
      id: generateUUID(),
      type: section.slideType,
      enabled: true,
      content,
      transition: 'fade' as const,
    };
  });

  // Step 7: Validate
  const validation = validateSlides(slides);

  return { frontmatter, slides, validation, errors };
}

function fixImageUrls(content: unknown): void {
  if (!content || typeof content !== 'object') return;
  const obj = content as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && (key === 'url' || key === 'image' || key === 'partnerLogo') && val && !val.startsWith('http')) {
      obj[key] = 'https://' + val;
    }
  }
}
