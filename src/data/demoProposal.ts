import type { Proposal } from '../types/proposal';

export const DEMO_PROPOSAL_ID = '00000000-0000-0000-0000-000000000000';
export const DEMO_PROPOSAL_SLUG = 'demo';
export const DEMO_WORKSPACE_ID = 'demo-workspace';

export function isDemoProposal(id: string): boolean {
  return id === DEMO_PROPOSAL_ID;
}

export const DEMO_PROPOSAL: Proposal = {
  id: DEMO_PROPOSAL_ID,
  workspace_id: DEMO_WORKSPACE_ID,
  slug: DEMO_PROPOSAL_SLUG,
  shortCode: 'DEMO26',
  title: 'Handshake Studio x Northstar Coffee — Growth Partnership',
  partnerName: 'Northstar Coffee',
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  status: 'published',
  visibility: 'public',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'demo-slide-title',
      type: 'title',
      enabled: true,
      transition: 'fade',
      content: {
        partnerName: 'Northstar Coffee',
        headline: 'A Strategic Digital Experience Partnership',
        subheadline: 'How Handshake Studio helps Northstar convert more visitors into repeat customers.',
        date: 'February 2026',
      },
    },
    {
      id: 'demo-slide-intro',
      type: 'intro',
      enabled: true,
      transition: 'slide-up',
      content: {
        heading: 'Context and Opportunity',
        body: 'Northstar has built a premium product and loyal following, but paid traffic conversion and post-purchase retention are underperforming. This proposal outlines a focused 90-day engagement to improve conversion, increase average order value, and create a scalable growth system.',
        imagePosition: 'right',
      },
    },
    {
      id: 'demo-slide-stats',
      type: 'stats',
      enabled: true,
      transition: 'slide-up',
      content: {
        heading: 'Current Baseline',
        stats: [
          { value: 2.1, suffix: '%', label: 'Storefront Conversion Rate', description: 'Across paid and organic sessions' },
          { value: 42, prefix: '$', label: 'Average Order Value', description: 'Strong room for upsell lift' },
          { value: 28, suffix: '%', label: 'Repeat Purchase in 90 Days', description: 'Retention can be improved with lifecycle flows' },
          { value: 180000, prefix: '$', label: 'Monthly Revenue', description: 'Targeting consistent month-over-month growth' },
        ],
      },
    },
    {
      id: 'demo-slide-features',
      type: 'features',
      enabled: true,
      transition: 'slide-left',
      content: {
        heading: 'What We Will Build',
        subheading: 'A complete conversion and retention system',
        features: [
          {
            title: 'High-Intent Landing Flows',
            description: 'Campaign-specific landing experiences aligned to ad intent and product value messaging.',
          },
          {
            title: 'Offer and Bundle Architecture',
            description: 'Data-backed product bundles and checkout incentives to increase AOV without discount dependence.',
          },
          {
            title: 'Lifecycle Automation',
            description: 'Welcome, replenishment, and win-back sequences with segment-driven personalization.',
          },
          {
            title: 'Experimentation Cadence',
            description: 'Weekly tests, fast learning loops, and transparent reporting to compound wins over time.',
          },
        ],
      },
    },
    {
      id: 'demo-slide-comparison',
      type: 'comparison',
      enabled: true,
      transition: 'slide-left',
      content: {
        heading: 'Before and After Engagement',
        before: {
          label: 'Today',
          items: [
            'Generic campaign traffic to one-size-fits-all pages',
            'Minimal post-purchase communication',
            'Ad hoc promotions with low strategic consistency',
            'Limited insight into what actually drives repeat orders',
          ],
        },
        after: {
          label: 'After 90 Days',
          items: [
            'Channel-specific conversion journeys mapped to intent',
            'Automated lifecycle flows tied to customer behavior',
            'Clear pricing and bundle strategy tied to margin targets',
            'Reliable testing framework with measurable performance gains',
          ],
        },
      },
    },
    {
      id: 'demo-slide-benefits',
      type: 'benefits',
      enabled: true,
      transition: 'slide-up',
      content: {
        heading: 'Business Outcomes for Northstar',
        benefits: [
          {
            title: 'Faster Revenue Lift',
            description: 'Early conversion wins within the first sprint through immediate landing and checkout improvements.',
          },
          {
            title: 'Higher Customer Lifetime Value',
            description: 'Retention-focused lifecycle campaigns that improve repeat frequency and subscription enrollment.',
          },
          {
            title: 'Lower Acquisition Waste',
            description: 'Sharper audience-message alignment that improves return on ad spend and reduces leakage.',
          },
          {
            title: 'Internal Team Enablement',
            description: 'Playbooks and dashboards your team can use after the engagement to sustain performance.',
          },
        ],
      },
    },
    {
      id: 'demo-slide-table',
      type: 'table',
      enabled: true,
      transition: 'fade',
      content: {
        heading: 'Engagement Structure',
        description: 'Recommended plan and expected deliverables.',
        columns: ['Package', 'Duration', 'Includes', 'Investment'],
        rows: [
          ['Growth Sprint', '30 days', 'Audit, quick wins, launch dashboard', '$9,500'],
          ['Full Partnership', '90 days', 'Build, testing, lifecycle, optimization', '$24,000'],
          ['Retainer Extension', 'Monthly', 'Continuous experimentation and reporting', '$6,000'],
        ],
      },
    },
    {
      id: 'demo-slide-testimonial',
      type: 'testimonial',
      enabled: true,
      transition: 'scale',
      content: {
        quote: 'Handshake gave us a clear roadmap and moved faster than any partner we have worked with. We saw measurable lift by week three.',
        author: 'Maya Jensen',
        role: 'VP of Growth',
        company: 'Harbor Goods',
      },
    },
    {
      id: 'demo-slide-timeline',
      type: 'timeline',
      enabled: true,
      transition: 'slide-up',
      content: {
        heading: '90-Day Delivery Timeline',
        milestones: [
          {
            date: 'Weeks 1-2',
            title: 'Discovery and Diagnostic',
            description: 'Channel audit, funnel analysis, instrumentation review, and KPI alignment.',
          },
          {
            date: 'Weeks 3-5',
            title: 'Build and Launch',
            description: 'New landing flows, revised offer strategy, and lifecycle automation rollout.',
          },
          {
            date: 'Weeks 6-9',
            title: 'Experiment and Optimize',
            description: 'A/B testing cadence, retention optimization, and iterative creative updates.',
          },
          {
            date: 'Weeks 10-12',
            title: 'Scale and Handoff',
            description: 'Performance playbook, roadmap, and team enablement for sustained growth.',
          },
        ],
      },
    },
    {
      id: 'demo-slide-media',
      type: 'media',
      enabled: true,
      transition: 'blur',
      content: {
        mediaType: 'image',
        url: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=80',
        caption: 'A premium digital storefront experience optimized for conversion and retention.',
        fit: 'cover',
      },
    },
    {
      id: 'demo-slide-closing',
      type: 'closing',
      enabled: true,
      transition: 'fade',
      content: {
        heading: 'Ready to Build the Next Chapter?',
        subheading: 'Approve the partnership and we start discovery this week.',
        ctaText: 'Book Kickoff',
        ctaUrl: 'https://www.handshake.design',
        contactName: 'Handshake Studio Team',
        contactEmail: 'hello@handshake.design',
      },
    },
  ],
};
