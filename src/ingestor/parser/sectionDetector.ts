export interface RawSection {
  index: number;
  raw: string;
  isFrontmatter: boolean;
}

function isFrontmatterBlock(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Must have key: value pairs and no markdown headings
  if (/^#\s/m.test(trimmed)) return false;
  return /^[a-zA-Z_][a-zA-Z0-9_]*\s*:/m.test(trimmed);
}

export function detectSections(markdown: string): RawSection[] {
  // Split on lines that are exactly `---` (with optional surrounding whitespace)
  const parts = markdown.split(/^[ \t]*---[ \t]*$/m);

  const sections: RawSection[] = [];
  let contentIndex = 0;

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim();
    if (!raw) continue;

    const isFrontmatter = sections.length === 0 && isFrontmatterBlock(raw);

    sections.push({
      index: isFrontmatter ? -1 : contentIndex++,
      raw,
      isFrontmatter,
    });
  }

  return sections;
}

export function parseFrontmatter(sections: RawSection[]): Record<string, string> {
  const fm = sections.find((s) => s.isFrontmatter);
  if (!fm) return {};

  const result: Record<string, string> = {};
  const lines = fm.raw.split('\n');
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+)$/);
    if (match) {
      result[match[1].trim()] = match[2].trim();
    }
  }
  return result;
}
