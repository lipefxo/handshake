import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

async function ensureDomPurifyForNode(): Promise<void> {
  const dompurifyModule = await import('dompurify');
  const dompurify = (dompurifyModule.default ?? dompurifyModule) as { sanitize?: (input: string) => string };

  if (typeof dompurify.sanitize !== 'function') {
    dompurify.sanitize = (input: string) => String(input);
  }
}

async function main(): Promise<void> {
  await ensureDomPurifyForNode();
  const { markdownToSlides } = await import('../src/ingestor/parser/markdownToSlides.ts');

  const markdown = readFileSync(
    new URL('../src/ingestor/templates/plainTextPasteSample.md', import.meta.url),
    'utf8',
  );

  const result = markdownToSlides(markdown);
  const types = result.slides.map((slide) => slide.type);

  assert.equal(result.errors.length, 0, `Expected no parser errors, got: ${result.errors.join('; ')}`);
  assert.ok(result.slides.length >= 9, `Expected at least 9 slides, got ${result.slides.length}`);
  assert.ok(types.includes('title'), 'Expected a title slide to be inferred.');
  assert.ok(types.includes('table'), 'Expected at least one table slide to be inferred.');
  assert.ok(types.includes('closing'), 'Expected a closing slide to be inferred.');
  assert.ok(types.includes('features') || types.includes('benefits'), 'Expected at least one feature/benefit slide.');
  assert.ok(
    result.frontmatter.title?.toLowerCase().includes('executive summary'),
    'Expected frontmatter title to use the leading H1 heading.',
  );

  const hasValidationErrors = result.validation.some((entry) => entry.status === 'error');
  assert.equal(hasValidationErrors, false, 'Expected no validation errors for plain text fixture.');

  console.log('Plain text fixture parse passed.');
  console.log(`Slides: ${types.join(' -> ')}`);
}

main().catch((error) => {
  console.error('Plain text fixture parse failed.');
  console.error(error);
  process.exit(1);
});
