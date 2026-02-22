import { v4 as generateUUID } from 'uuid';
import type { SlideConfig } from '../../types/proposal';
import { detectSections, parseFrontmatter } from './sectionDetector';
import { inferSlideType } from './slideTypeInferrer';
import { extractContent, extractLinks } from './contentExtractor';
import { validateSlides } from './validationLayer';
import type { ValidationResult } from './validationLayer';
import { sanitizeText } from '../../shared/utils/validation';

function insertDividersBeforeH2(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];

  for (const line of lines) {
    const isH2 = /^##\s+/.test(line.trimStart());
    if (isH2 && output.length > 0) {
      let prev = output.length - 1;
      while (prev >= 0 && output[prev].trim() === '') prev--;
      if (prev >= 0 && output[prev].trim() !== '---') {
        output.push('');
        output.push('---');
      }
    }
    output.push(line);
  }

  return output.join('\n');
}

function stripLeadingDocumentH1(markdown: string): string {
  const startsWithH1 = /^\s*#\s+.+$/m.test(markdown);
  const hasSectionH2 = /^##\s+.+$/m.test(markdown);
  if (!startsWithH1 || !hasSectionH2) return markdown;

  const lines = markdown.split('\n');
  const firstH1Index = lines.findIndex((line) => /^#\s+/.test(line.trimStart()));
  if (firstH1Index === -1) return markdown;

  const withoutH1 = [...lines.slice(0, firstH1Index), ...lines.slice(firstH1Index + 1)];
  while (withoutH1.length > 0 && withoutH1[0].trim() === '') {
    withoutH1.shift();
  }
  return withoutH1.join('\n');
}

function promoteLeadingH2ToH1PerSection(markdown: string): string {
  const sections = markdown.split(/^[ \t]*---[ \t]*$/m);

  const promoted = sections.map((section) => {
    const lines = section.split('\n');
    const hasH1 = lines.some((line) => /^#\s+/.test(line.trimStart()));
    if (hasH1) return section;

    for (let i = 0; i < lines.length; i++) {
      if (/^##\s+/.test(lines[i].trimStart())) {
        lines[i] = lines[i].replace(/^(\s*)##\s+/, '$1# ');
        break;
      }
    }

    return lines.join('\n');
  });

  return promoted.join('\n---\n');
}

function normalizeEmojiParagraphs(markdown: string): string {
  return markdown.replace(
    /^(\s*)(\p{Emoji_Presentation}|\p{Extended_Pictographic})\uFE0F?\s+/gmu,
    '$1- ',
  );
}

function stripStrikethrough(markdown: string): string {
  return markdown.replace(/~~[^~]+~~/g, '');
}

function isTableSeparatorRow(row: string): boolean {
  const trimmed = row.trim();
  if (!trimmed.startsWith('|')) return false;
  const normalized = trimmed.replace(/^\|/, '').replace(/\|$/, '');
  const cells = normalized.split('|').map((cell) => cell.trim());
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function cleanTableCell(cell: string): string {
  return sanitizeText(cell.replace(/\*\*/g, '').replace(/__/g, '').trim());
}

function convertTableBlockToBulletLines(blockLines: string[]): string[] {
  const rows: string[] = [];
  for (const line of blockLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('|')) {
      rows.push(trimmed);
    } else if (rows.length > 0) {
      rows[rows.length - 1] = `${rows[rows.length - 1]} ${trimmed}`;
    }
  }

  const separatorIndex = rows.findIndex(isTableSeparatorRow);
  if (separatorIndex === -1) return blockLines;

  const dataRows = rows.slice(separatorIndex + 1);
  const bullets = dataRows
    .map((row) => {
      const trimmed = row.replace(/^\|/, '').replace(/\|$/, '');
      const cells = trimmed.split('|').map(cleanTableCell).filter(Boolean);
      if (cells.length === 0) return '';
      return `- ${cells.join(' | ')}`;
    })
    .filter(Boolean);

  return bullets.length > 0 ? bullets : blockLines;
}

function convertMarkdownTablesToBulletPipes(markdown: string): string {
  const lines = markdown.split('\n');
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trimStart();
    const startsTable = trimmed.startsWith('|');
    if (!startsTable) {
      output.push(lines[i]);
      i++;
      continue;
    }

    const block: string[] = [];
    while (i < lines.length) {
      const line = lines[i];
      const current = line.trimStart();
      if (current.startsWith('|')) {
        block.push(line);
        i++;
        continue;
      }
      if (block.length > 0 && current.trim() !== '' && current.includes('|')) {
        block.push(line);
        i++;
        continue;
      }
      break;
    }

    output.push(...convertTableBlockToBulletLines(block));
  }

  return output.join('\n');
}

function normalizeMarkdown(markdown: string): string {
  let normalized = markdown;
  normalized = stripLeadingDocumentH1(normalized);
  normalized = insertDividersBeforeH2(normalized);
  normalized = promoteLeadingH2ToH1PerSection(normalized);
  normalized = normalizeEmojiParagraphs(normalized);
  normalized = stripStrikethrough(normalized);
  normalized = convertMarkdownTablesToBulletPipes(normalized);
  return normalized;
}

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

  const normalizedMarkdown = normalizeMarkdown(markdown);

  // Step 1: Detect sections
  const sections = detectSections(normalizedMarkdown);

  // Step 2: Extract frontmatter
  const fmRaw = parseFrontmatter(sections);
  const firstRawH1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
  const frontmatter = {
    title: sanitizeText(fmRaw['title'] ?? ''),
    partner: sanitizeText(fmRaw['partner'] ?? ''),
    date: sanitizeText(fmRaw['date'] ?? ''),
    theme: sanitizeText(fmRaw['theme'] ?? ''),
  };

  // Step 3: Filter to content sections
  const contentSections = sections.filter((s) => !s.isFrontmatter);

  if (!frontmatter.title && contentSections.length > 0) {
    const firstSection = contentSections[0].raw;
    const h1Match = firstSection.match(/^#\s+(.+)$/m);
    const extractedTitle = sanitizeText(firstRawH1 || h1Match?.[1]?.trim() || '');
    if (extractedTitle) {
      frontmatter.title = extractedTitle;

      if (!frontmatter.partner) {
        const partnerMatch = extractedTitle.match(/^(.+?)\s+[x×&]\s+(.+?)(?:\s*[-|].+)?$/i);
        if (partnerMatch) {
          frontmatter.partner = sanitizeText(partnerMatch[2].trim());
        }
      }
    }
  }

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
    const links = extractLinks(section.raw);

    return {
      id: generateUUID(),
      type: section.slideType,
      enabled: true,
      content,
      links: links.length > 0 ? links : undefined,
      transition: 'fade' as const,
    };
  });

  // Step 7: Validate
  const validation = validateSlides(slides);

  return { frontmatter, slides, validation, errors };
}
