import { describe, expect, it } from 'vitest';
import { markdownToSlides } from './markdownToSlides';
import sampleMarkdown from '../templates/notionSample.md?raw';

describe('markdownToSlides', () => {
  it('preserves pricing tables and splits oversized benefits in the sample fixture', () => {
    const result = markdownToSlides(sampleMarkdown);

    expect(result.errors).toEqual([]);
    expect(result.slides.map((slide) => slide.type)).toEqual([
      'title',
      'benefits',
      'benefits',
      'table',
      'features',
      'closing',
    ]);

    const tableSlide = result.slides.find((slide) => slide.type === 'table');
    expect(tableSlide?.content.columns).toEqual(['Service', 'Proposal Pricing']);
    expect(tableSlide?.content.rows).toEqual(
      expect.arrayContaining([
        expect.arrayContaining(['Total Program Cost', '$22,297']),
      ]),
    );
  });

  it('reports an error for empty markdown', () => {
    expect(markdownToSlides('   ').errors).toContain('No markdown content provided.');
  });
});
