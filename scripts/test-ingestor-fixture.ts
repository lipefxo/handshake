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
    new URL('../src/ingestor/templates/notionSample.md', import.meta.url),
    'utf8',
  );

  const result = markdownToSlides(markdown);
  const expectedSlideTypes = ['title', 'benefits', 'intro', 'table', 'features', 'closing'];

  assert.equal(result.errors.length, 0, `Expected no parser errors, got: ${result.errors.join('; ')}`);
  assert.equal(result.slides.length, 6, `Expected 6 slides, got ${result.slides.length}`);
  assert.deepEqual(
    result.slides.map((slide) => slide.type),
    expectedSlideTypes,
    'Slide type order does not match expected conversion.',
  );
  assert.equal(result.frontmatter.partner, 'U.S. Black Chambers', 'Partner was not extracted as expected.');
  assert.ok(
    result.frontmatter.title?.toLowerCase().includes('target retail readiness accelerator'),
    'Frontmatter title was not extracted from the source markdown H1.',
  );

  const hasValidationErrors = result.validation.some((entry) => entry.status === 'error');
  assert.equal(hasValidationErrors, false, 'Expected no validation errors after conversion.');

  const extractedLinks = result.slides.flatMap((slide) => slide.links ?? []);
  assert.ok(extractedLinks.length > 0, 'Expected at least one extracted link.');
  assert.ok(
    extractedLinks.some((link) => link.url.includes('loom.com/share/3f7b4c0e47e54cef847136c59cd66ac9')),
    'Expected Loom link to be extracted into slide links.',
  );

  console.log('Fixture parse passed.');
  console.log(`Slides: ${result.slides.map((slide) => slide.type).join(' -> ')}`);
  console.log(`Extracted links: ${extractedLinks.length}`);
}

main().catch((error) => {
  console.error('Fixture parse failed.');
  console.error(error);
  process.exit(1);
});
