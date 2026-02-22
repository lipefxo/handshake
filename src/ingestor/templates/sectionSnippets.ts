import type { SlideType } from '../../types/proposal';

export const snippets: Record<SlideType, string> = {
  title: `# Your Headline Here
<!-- type: title -->
Partner × Acme Corp

Your subheadline here.

---`,

  stats: `# Key Metrics
<!-- type: stats -->

- 100+ | Metric label one
- $5M | Metric label two
- 99% | Metric label three

---`,

  features: `# Key Features
<!-- type: features -->

- [icon: slide.features.default] Feature One | Description of this feature
- [icon: slide.features.protection] Feature Two | Description of this feature
- [icon: slide.features.speed] Feature Three | Description of this feature

---`,

  testimonial: `# What Partners Say
<!-- type: testimonial -->

> "Your testimonial quote goes here."

— Name, Role at Company

---`,

  comparison: `# The Difference
<!-- type: comparison -->

**Before:**
- Pain point one
- Pain point two
- Pain point three

**After:**
- Solution one
- Solution two
- Solution three

---`,

  timeline: `# Roadmap
<!-- type: timeline -->

- Q1 2026 | Phase One | Description
- Q2 2026 | Phase Two | Description
- Q3 2026 | Phase Three | Description

---`,

  benefits: `# Partner Benefits
<!-- type: benefits -->

- [icon: slide.benefits.volume-pricing] Benefit One | What the partner gets
- [icon: slide.benefits.account-manager] Benefit Two | What the partner gets
- [icon: slide.benefits.default] Benefit Three | What the partner gets

---`,

  media: `![Caption text](https://example.com/image.jpg)
<!-- type: media, fit: cover -->

---`,

  table: `# Plan Comparison
<!-- type: table -->

A quick side-by-side view.

| Plan | Monthly | Support |
| --- | --- | --- |
| Starter | $499 | Email |
| Growth | $999 | Priority email |
| Enterprise | Custom | Dedicated manager |

---`,

  intro: `# Section Heading
<!-- type: intro -->

Your body text goes here. This can be multiple paragraphs
with as much detail as needed.

![Optional image](https://example.com/image.jpg)

---`,

  closing: `# Let's Get Started
<!-- type: closing -->

Your closing message here.

**Contact Name** | Head of Partnerships
email@company.com | (555) 123-4567

[Schedule a Call](https://calendly.com/your-link)

---`,
};

export const SNIPPET_LABELS: Record<SlideType, string> = {
  title: 'Title',
  intro: 'Intro',
  stats: 'Stats',
  features: 'Features',
  benefits: 'Benefits',
  testimonial: 'Testimonial',
  comparison: 'Comparison',
  timeline: 'Timeline',
  media: 'Media',
  table: 'Table',
  closing: 'Closing',
};
