import type {
  SlideConfig,
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
import type { Proposal } from '../../types/proposal';

// ---------------------------------------------------------------------------
// Per-type serializers
// ---------------------------------------------------------------------------

function serializeTitle(content: TitleSlideContent): string {
  const parts: string[] = ['<!-- type: title -->'];
  if (content.headline) parts.push(`# ${content.headline}`);
  if (content.subheadline) {
    parts.push('');
    parts.push(content.subheadline);
  }
  if (content.partnerName) {
    parts.push('');
    parts.push(`${content.partnerName} × SecureBags`);
  }
  if (content.partnerLogo) {
    parts.push(`![logo](${content.partnerLogo})`);
  }
  return parts.join('\n');
}

function serializeIntro(content: IntroSlideContent): string {
  const directive =
    content.imagePosition === 'left'
      ? '<!-- type: intro, image_position: left -->'
      : '<!-- type: intro -->';
  const lines: string[] = [directive];
  if (content.heading) lines.push(`# ${content.heading}`);
  if (content.body) lines.push(content.body);
  if (content.image) lines.push(`![image](${content.image})`);
  return lines.join('\n');
}

function serializeStats(content: StatsSlideContent): string {
  const lines: string[] = ['<!-- type: stats -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  for (const stat of content.stats) {
    const valueStr = `${stat.prefix ?? ''}${stat.value}${stat.suffix ?? ''}`;
    const parts: string[] = [valueStr, stat.label];
    if (stat.description) parts.push(stat.description);
    lines.push(`- ${parts.join(' | ')}`);
  }
  return lines.join('\n');
}

function serializeFeatures(content: FeaturesSlideContent): string {
  const lines: string[] = ['<!-- type: features -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  if (content.subheading) lines.push(content.subheading);
  for (const feature of content.features) {
    const iconPart = feature.icon ? `[icon: ${feature.icon}] ` : '';
    lines.push(`- ${iconPart}${feature.title} | ${feature.description}`);
  }
  return lines.join('\n');
}

function serializeTestimonial(content: TestimonialSlideContent): string {
  const lines: string[] = ['<!-- type: testimonial -->'];
  if (content.quote) lines.push(`> ${content.quote}`);
  if (content.author) {
    let attr = content.author;
    if (content.role || content.company) {
      attr += ',';
      if (content.role) attr += ` ${content.role}`;
      if (content.company) attr += ` at ${content.company}`;
    }
    lines.push(`— ${attr}`);
  }
  if (content.avatar) lines.push(`![avatar](${content.avatar})`);
  return lines.join('\n');
}

function serializeComparison(content: ComparisonSlideContent): string {
  const lines: string[] = ['<!-- type: comparison -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  lines.push('');
  lines.push(`**${content.before.label}:**`);
  for (const item of content.before.items) lines.push(`- ${item}`);
  lines.push('');
  lines.push(`**${content.after.label}:**`);
  for (const item of content.after.items) lines.push(`- ${item}`);
  return lines.join('\n');
}

function serializeTimeline(content: TimelineSlideContent): string {
  const lines: string[] = ['<!-- type: timeline -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  for (const milestone of content.milestones) {
    const parts: string[] = [milestone.date, milestone.title];
    if (milestone.description) parts.push(milestone.description);
    lines.push(`- ${parts.join(' | ')}`);
  }
  return lines.join('\n');
}

function serializeMedia(content: MediaSlideContent): string {
  const fitPart = content.fit ? `, fit: ${content.fit}` : '';
  const lines: string[] = [`<!-- type: media${fitPart} -->`];
  lines.push(`![${content.caption ?? ''}](${content.url})`);
  return lines.join('\n');
}

function serializeBenefits(content: BenefitsSlideContent): string {
  const lines: string[] = ['<!-- type: benefits -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  for (const benefit of content.benefits) {
    const iconPart = benefit.icon ? `[icon: ${benefit.icon}] ` : '';
    lines.push(`- ${iconPart}${benefit.title} | ${benefit.description}`);
  }
  return lines.join('\n');
}

function serializeClosing(content: ClosingSlideContent): string {
  const lines: string[] = ['<!-- type: closing -->'];
  if (content.heading) lines.push(`# ${content.heading}`);
  if (content.subheading) lines.push(content.subheading);
  const hasContact =
    content.contactName || content.contactEmail || content.contactPhone;
  if (hasContact) {
    lines.push('');
    if (content.contactName) lines.push(`**${content.contactName}**`);
    if (content.contactEmail) lines.push(content.contactEmail);
    if (content.contactPhone) lines.push(content.contactPhone);
  }
  if (content.ctaText && content.ctaUrl) {
    lines.push('');
    lines.push(`[${content.ctaText}](${content.ctaUrl})`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function slideToMarkdown(slide: SlideConfig): string {
  let markdown = '';
  switch (slide.type) {
    case 'title':
      markdown = serializeTitle(slide.content as TitleSlideContent);
      break;
    case 'intro':
      markdown = serializeIntro(slide.content as IntroSlideContent);
      break;
    case 'stats':
      markdown = serializeStats(slide.content as StatsSlideContent);
      break;
    case 'features':
      markdown = serializeFeatures(slide.content as FeaturesSlideContent);
      break;
    case 'testimonial':
      markdown = serializeTestimonial(slide.content as TestimonialSlideContent);
      break;
    case 'comparison':
      markdown = serializeComparison(slide.content as ComparisonSlideContent);
      break;
    case 'timeline':
      markdown = serializeTimeline(slide.content as TimelineSlideContent);
      break;
    case 'media':
      markdown = serializeMedia(slide.content as MediaSlideContent);
      break;
    case 'benefits':
      markdown = serializeBenefits(slide.content as BenefitsSlideContent);
      break;
    case 'closing':
      markdown = serializeClosing(slide.content as ClosingSlideContent);
      break;
  }

  if (slide.links && slide.links.length > 0) {
    const linkLines = slide.links
      .map((link) => {
        const text = link.text?.trim();
        const url = link.url?.trim();
        return text && url ? `[${text}](${url})` : '';
      })
      .filter(Boolean);

    if (linkLines.length > 0) {
      markdown += `\n\n${linkLines.join('\n')}`;
    }
  }

  return markdown;
}

export function slidesToMarkdown(
  proposal: Pick<Proposal, 'title' | 'partnerName' | 'themeId' | 'slides'>,
): string {
  const sections: string[] = [];

  // Frontmatter
  const fmLines: string[] = [];
  if (proposal.title) fmLines.push(`title: ${proposal.title}`);
  if (proposal.partnerName) fmLines.push(`partner: ${proposal.partnerName}`);
  if (proposal.themeId) fmLines.push(`theme: ${proposal.themeId}`);
  if (fmLines.length > 0) sections.push(fmLines.join('\n'));

  // Enabled slides only
  for (const slide of proposal.slides) {
    if (!slide.enabled) continue;
    sections.push(slideToMarkdown(slide));
  }

  return sections.join('\n\n---\n\n');
}
