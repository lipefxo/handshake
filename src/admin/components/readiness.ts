import type { Proposal, SlideConfig, TitleSlideContent, IntroSlideContent, MediaSlideContent, ClosingSlideContent } from '../../types/proposal';

export type ReadinessIssue = {
  severity: 'error' | 'warning';
  message: string;
  slideIndex?: number;
};

export function checkProposalReadiness(proposal: Proposal): ReadinessIssue[] {
  const issues: ReadinessIssue[] = [];
  const enabledSlides = proposal.slides.filter((s) => s.enabled);

  if (enabledSlides.length === 0) {
    issues.push({ severity: 'error', message: 'No enabled slides. Add at least one slide.' });
    return issues;
  }

  if (!proposal.title.trim()) {
    issues.push({ severity: 'error', message: 'Proposal title is empty.' });
  }

  if (!proposal.partnerName.trim()) {
    issues.push({ severity: 'error', message: 'Partner name is empty.' });
  }

  enabledSlides.forEach((slide) => {
    const globalIndex = proposal.slides.indexOf(slide);
    const slideLabel = slide.customLabel || `Slide ${globalIndex + 1}`;
    checkSlideContent(slide, slideLabel, globalIndex, issues);
  });

  if (!enabledSlides.some((s) => s.type === 'closing')) {
    issues.push({ severity: 'warning', message: 'No closing slide with a call-to-action. Consider adding one.' });
  }

  if (!enabledSlides.some((s) => s.type === 'title')) {
    issues.push({ severity: 'warning', message: 'No title slide. Your proposal may lack a strong opening.' });
  }

  return issues;
}

function checkSlideContent(slide: SlideConfig, label: string, index: number, issues: ReadinessIssue[]) {
  const content = slide.content;

  switch (slide.type) {
    case 'title': {
      const c = content as TitleSlideContent;
      if (!c.headline?.trim()) issues.push({ severity: 'warning', message: `${label}: headline is empty.`, slideIndex: index });
      break;
    }
    case 'intro': {
      const c = content as IntroSlideContent;
      if (!c.body?.trim()) issues.push({ severity: 'warning', message: `${label}: body text is empty.`, slideIndex: index });
      break;
    }
    case 'media': {
      const c = content as MediaSlideContent;
      if (!c.url?.trim()) issues.push({ severity: 'error', message: `${label}: missing media URL.`, slideIndex: index });
      break;
    }
    case 'closing': {
      const c = content as ClosingSlideContent;
      if (!c.heading?.trim()) issues.push({ severity: 'warning', message: `${label}: closing heading is empty.`, slideIndex: index });
      break;
    }
    case 'stats': {
      const c = content as { stats?: unknown[] };
      if (!c.stats || c.stats.length === 0) issues.push({ severity: 'warning', message: `${label}: no stats defined.`, slideIndex: index });
      break;
    }
    case 'features': {
      const c = content as { features?: unknown[] };
      if (!c.features || c.features.length === 0) issues.push({ severity: 'warning', message: `${label}: no features listed.`, slideIndex: index });
      break;
    }
    case 'bullet-list': {
      const c = content as { items?: string[] };
      if (!c.items || c.items.length === 0) issues.push({ severity: 'warning', message: `${label}: no items in bullet list.`, slideIndex: index });
      break;
    }
    case 'timeline': {
      const c = content as { milestones?: unknown[] };
      if (!c.milestones || c.milestones.length === 0) issues.push({ severity: 'warning', message: `${label}: no milestones in timeline.`, slideIndex: index });
      break;
    }
    case 'table': {
      const c = content as { rows?: unknown[]; columns?: unknown[] };
      if (!c.columns || c.columns.length === 0) issues.push({ severity: 'warning', message: `${label}: table has no columns.`, slideIndex: index });
      if (!c.rows || c.rows.length === 0) issues.push({ severity: 'warning', message: `${label}: table has no rows.`, slideIndex: index });
      break;
    }
  }
}
