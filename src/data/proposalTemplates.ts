import { v4 as uuidv4 } from 'uuid';
import type { SlideConfig, TitleSlideContent, ClosingSlideContent } from '../types/proposal';
import type { ThemeId } from '../themes/themeTypes';
import type { ProposalSeedData } from './slideDefaults';

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'partnership' | 'sales' | 'sponsorship' | 'agency' | 'event' | 'general';
  themeId: ThemeId;
  slides: SlideConfig[];
}

function freshIds(slides: SlideConfig[]): SlideConfig[] {
  return slides.map((s) => ({ ...s, id: uuidv4() }));
}

function applySeed(slides: SlideConfig[], seed: ProposalSeedData): SlideConfig[] {
  return slides.map((slide) => {
    if (slide.type === 'title') {
      const content = slide.content as TitleSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          partnerName: seed.partnerName?.trim() || content.partnerName,
          headline: seed.title?.trim() || content.headline,
          date: seed.proposalDate || content.date,
        },
      };
    }
    if (slide.type === 'closing') {
      const content = slide.content as ClosingSlideContent;
      return {
        ...slide,
        content: {
          ...content,
          contactName: seed.contactName?.trim() || content.contactName,
          contactEmail: seed.contactEmail?.trim() || content.contactEmail,
        },
      };
    }
    return slide;
  });
}

// ─── Template definitions ──────────────────────────────────────────────────────

const partnershipProposal: ProposalTemplate = {
  id: 'tpl-partnership',
  name: 'Partnership Proposal',
  description: 'Strategic partnership pitch with stats, benefits, timeline, and closing CTA.',
  category: 'partnership',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Partner Company',
        headline: 'A Strategic Growth Partnership',
        subheadline: 'Combining strengths to unlock new revenue and reach.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'The Opportunity',
        body: 'Both organizations serve complementary audiences with aligned values. This partnership combines distribution reach with product depth to accelerate growth for both sides.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Why Now',
        stats: [
          { value: 340, suffix: '%', label: 'Market Growth', description: 'Category expansion over 3 years' },
          { value: 2.4, prefix: '$', suffix: 'B', label: 'Addressable Market', description: 'Combined TAM opportunity' },
          { value: 72, suffix: '%', label: 'Audience Overlap', description: 'Shared demographic profile' },
          { value: 18, suffix: 'mo', label: 'Time to Value', description: 'Projected partnership ROI timeline' },
        ],
      },
    },
    {
      id: 'tpl-4', type: 'features', enabled: true, transition: 'slide-left',
      content: {
        heading: 'What We Bring',
        subheading: 'Our core capabilities and differentiators',
        features: [
          { title: 'Distribution Network', description: 'Access to 500+ retail locations and a growing direct-to-consumer channel.' },
          { title: 'Brand Equity', description: 'Trusted by 80,000+ customers with a 4.8 average satisfaction rating.' },
          { title: 'Operational Scale', description: 'In-house fulfillment with 99.5% on-time delivery across all regions.' },
          { title: 'Data & Insights', description: 'First-party data engine with predictive analytics on consumer behavior.' },
        ],
      },
    },
    {
      id: 'tpl-5', type: 'comparison', enabled: true, transition: 'slide-left',
      content: {
        heading: 'Independent vs. Together',
        before: {
          label: 'Going Alone',
          items: [
            'Slower market entry and higher customer acquisition cost',
            'Limited cross-channel visibility',
            'Competing for the same audience separately',
            'Resource-intensive product launches',
          ],
        },
        after: {
          label: 'Partnered',
          items: [
            'Faster go-to-market through shared distribution',
            'Unified data and joint attribution',
            'Co-branded campaigns with built-in trust',
            'Shared investment on launches and experimentation',
          ],
        },
      },
    },
    {
      id: 'tpl-6', type: 'benefits', enabled: true, transition: 'slide-up',
      content: {
        heading: 'What You Get',
        benefits: [
          { title: 'Revenue Share', description: 'Performance-based revenue sharing with transparent reporting.' },
          { title: 'Co-Marketing', description: 'Joint campaigns, content, and event presence to amplify reach.' },
          { title: 'Dedicated Support', description: 'A named partnership manager and quarterly business reviews.' },
          { title: 'Exclusive Access', description: 'Early access to product launches, beta features, and roadmap input.' },
        ],
      },
    },
    {
      id: 'tpl-7', type: 'timeline', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Partnership Roadmap',
        milestones: [
          { date: 'Month 1', title: 'Alignment & Planning', description: 'Define goals, KPIs, and joint go-to-market strategy.' },
          { date: 'Month 2-3', title: 'Integration & Launch', description: 'Technical integration, co-branded assets, and soft launch.' },
          { date: 'Month 4-6', title: 'Scale & Optimize', description: 'Full rollout, A/B testing, and performance optimization.' },
          { date: 'Ongoing', title: 'Grow Together', description: 'QBRs, expansion into new verticals, and deepened collaboration.' },
        ],
      },
    },
    {
      id: 'tpl-8', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Ready to Partner?',
        subheading: 'Let\'s schedule a call to align on next steps and timelines.',
        ctaText: 'Book a Call',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const salesProposal: ProposalTemplate = {
  id: 'tpl-sales',
  name: 'Sales Proposal',
  description: 'Solution-focused pitch with problem framing, features, pricing, and social proof.',
  category: 'sales',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Client Company',
        headline: 'A Tailored Solution for Your Growth',
        subheadline: 'How we solve your biggest challenges and deliver measurable results.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Understanding Your Challenge',
        body: 'After reviewing your current setup and objectives, we\'ve identified key areas where our solution can drive immediate impact. This proposal outlines a targeted approach to address your most pressing needs while building a foundation for long-term growth.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'bullet-list', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Key Challenges We\'ll Solve',
        subheading: 'Based on our discovery conversation',
        items: [
          'Manual processes consuming team bandwidth that could be spent on strategic work',
          'Fragmented data making it difficult to track performance and make decisions',
          'Scaling limitations preventing growth beyond current capacity',
          'Inconsistent customer experience across touchpoints',
        ],
      },
    },
    {
      id: 'tpl-4', type: 'features', enabled: true, transition: 'slide-left',
      content: {
        heading: 'Our Solution',
        subheading: 'Purpose-built to address your needs',
        features: [
          { title: 'Automation Engine', description: 'Eliminate manual work with intelligent workflow automation that scales.' },
          { title: 'Unified Dashboard', description: 'All your data in one place with real-time visibility and actionable insights.' },
          { title: 'Scalable Infrastructure', description: 'Built to grow with you — from startup to enterprise without re-platforming.' },
          { title: 'Dedicated Onboarding', description: 'White-glove implementation with a dedicated success manager.' },
        ],
      },
    },
    {
      id: 'tpl-5', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Proven Results',
        stats: [
          { value: 42, suffix: '%', label: 'Efficiency Gain', description: 'Average time saved across client operations' },
          { value: 3.2, suffix: 'x', label: 'ROI', description: 'Average return within first 12 months' },
          { value: 98, suffix: '%', label: 'Retention Rate', description: 'Clients who renew year over year' },
          { value: 14, label: 'Day Onboarding', description: 'Average time from sign-off to live' },
        ],
      },
    },
    {
      id: 'tpl-6', type: 'testimonial', enabled: true, transition: 'scale',
      content: {
        quote: 'Within 60 days we saw a measurable improvement in team productivity and a significant reduction in operational overhead. The ROI was clear by month three.',
        author: 'Jordan Mitchell',
        role: 'VP of Operations',
        company: 'Apex Solutions',
      },
    },
    {
      id: 'tpl-7', type: 'table', enabled: true, transition: 'fade',
      content: {
        heading: 'Investment Options',
        description: 'Flexible plans designed to match your scale and goals.',
        columns: ['Plan', 'Includes', 'Timeline', 'Investment'],
        rows: [
          ['Starter', 'Core platform, 5 users, email support', '14-day setup', '$X,XXX/mo'],
          ['Growth', 'Full platform, 25 users, priority support', '14-day setup', '$X,XXX/mo'],
          ['Enterprise', 'Custom deployment, unlimited users, dedicated CSM', 'Scoped', 'Custom'],
        ],
      },
    },
    {
      id: 'tpl-8', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Let\'s Get Started',
        subheading: 'We\'re confident this is the right solution. Let\'s make it happen.',
        ctaText: 'Schedule Demo',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const sponsorshipDeck: ProposalTemplate = {
  id: 'tpl-sponsorship',
  name: 'Sponsorship Deck',
  description: 'Audience stats, sponsorship tiers, and partnership benefits for sponsors.',
  category: 'sponsorship',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Sponsor Name',
        headline: 'Sponsorship Opportunity',
        subheadline: 'Reach an engaged audience and build lasting brand affinity.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'About Us',
        body: 'We\'ve built a highly engaged community of professionals and enthusiasts who trust our platform for discovery, education, and connection. Our sponsorship packages are designed to give brands authentic visibility within this audience.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Audience at a Glance',
        stats: [
          { value: 150, suffix: 'K', label: 'Monthly Active Users', description: 'Across web and mobile' },
          { value: 4.2, suffix: 'M', label: 'Monthly Impressions', description: 'Content views and engagements' },
          { value: 68, suffix: '%', label: 'Age 25-44', description: 'High-spending demographic' },
          { value: 82, suffix: '%', label: 'Engagement Rate', description: 'Active interaction with content' },
        ],
      },
    },
    {
      id: 'tpl-4', type: 'benefits', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Why Sponsor With Us',
        benefits: [
          { title: 'Targeted Reach', description: 'Access a niche audience that aligns with your brand values and customer profile.' },
          { title: 'Authentic Integration', description: 'Sponsorships woven into content naturally — not interruptive display ads.' },
          { title: 'Full-Funnel Visibility', description: 'Brand presence from awareness to consideration with trackable attribution.' },
          { title: 'Custom Activation', description: 'Bespoke campaigns, co-created content, and exclusive event access.' },
        ],
      },
    },
    {
      id: 'tpl-5', type: 'table', enabled: true, transition: 'fade',
      content: {
        heading: 'Sponsorship Tiers',
        description: 'Choose a level that matches your goals and budget.',
        columns: ['Tier', 'Placement', 'Duration', 'Investment'],
        rows: [
          ['Bronze', 'Logo placement, 1 newsletter mention', '1 month', '$X,XXX'],
          ['Silver', 'Featured content, social campaigns, event presence', '3 months', '$XX,XXX'],
          ['Gold', 'Exclusive category sponsor, co-branded content, keynote slot', '6 months', '$XX,XXX'],
          ['Platinum', 'Title sponsor, custom activations, full-funnel integration', '12 months', 'Custom'],
        ],
      },
    },
    {
      id: 'tpl-6', type: 'testimonial', enabled: true, transition: 'scale',
      content: {
        quote: 'Sponsoring this platform gave us direct access to exactly the audience we were trying to reach. The engagement and brand lift exceeded our benchmarks.',
        author: 'Taylor Reed',
        role: 'Head of Brand Marketing',
        company: 'Momentum Labs',
      },
    },
    {
      id: 'tpl-7', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Let\'s Build Something Together',
        subheading: 'We\'d love to craft a sponsorship package that fits your goals.',
        ctaText: 'Discuss Sponsorship',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const agencyPitch: ProposalTemplate = {
  id: 'tpl-agency',
  name: 'Agency Pitch',
  description: 'Service overview, process, case study, and engagement options for agencies.',
  category: 'agency',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Client Name',
        headline: 'Your Growth, Our Expertise',
        subheadline: 'A custom engagement designed to move the needle.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Who We Are',
        body: 'We\'re a performance-driven agency that partners with ambitious brands to build scalable growth systems. We don\'t do cookie-cutter strategies — every engagement is built from scratch based on your data, your goals, and your customers.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Our Track Record',
        stats: [
          { value: 120, suffix: '+', label: 'Clients Served', description: 'Across B2B and B2C verticals' },
          { value: 8.4, prefix: '$', suffix: 'M', label: 'Revenue Driven', description: 'Directly attributed to our work in 2025' },
          { value: 96, suffix: '%', label: 'Client Satisfaction', description: 'Post-engagement survey average' },
          { value: 2.1, suffix: 'x', label: 'Avg ROAS Lift', description: 'Within first 90 days' },
        ],
      },
    },
    {
      id: 'tpl-4', type: 'features', enabled: true, transition: 'slide-left',
      content: {
        heading: 'Services',
        subheading: 'Full-stack growth capabilities',
        features: [
          { title: 'Paid Media Management', description: 'Google, Meta, TikTok, and programmatic — optimized daily for performance.' },
          { title: 'Conversion Rate Optimization', description: 'Landing pages, A/B testing, and funnel analysis to maximize every click.' },
          { title: 'Content & Creative', description: 'Ad creative, landing pages, and brand assets designed to convert.' },
          { title: 'Analytics & Reporting', description: 'Custom dashboards, attribution modeling, and weekly performance reviews.' },
        ],
      },
    },
    {
      id: 'tpl-5', type: 'timeline', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Our Process',
        milestones: [
          { date: 'Week 1', title: 'Discovery', description: 'Deep dive into your business, audience, competitive landscape, and data.' },
          { date: 'Week 2-3', title: 'Strategy & Setup', description: 'Custom strategy development, tracking setup, and creative production.' },
          { date: 'Week 4-8', title: 'Launch & Learn', description: 'Campaign launch, rapid iteration, and initial performance benchmarks.' },
          { date: 'Ongoing', title: 'Optimize & Scale', description: 'Continuous optimization, reporting, and strategic expansion.' },
        ],
      },
    },
    {
      id: 'tpl-6', type: 'testimonial', enabled: true, transition: 'scale',
      content: {
        quote: 'They came in, understood our business fast, and delivered results we hadn\'t been able to achieve internally. The team felt like an extension of ours.',
        author: 'Casey Park',
        role: 'CMO',
        company: 'Ridgeline Commerce',
      },
    },
    {
      id: 'tpl-7', type: 'table', enabled: true, transition: 'fade',
      content: {
        heading: 'Engagement Options',
        description: 'Flexible models to match your needs.',
        columns: ['Model', 'Scope', 'Duration', 'Starting At'],
        rows: [
          ['Sprint', 'Focused audit + quick wins', '4 weeks', '$X,XXX'],
          ['Retainer', 'Full-service management', 'Monthly', '$X,XXX/mo'],
          ['Project', 'Defined deliverables', 'Scoped', 'Custom'],
        ],
      },
    },
    {
      id: 'tpl-8', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Let\'s Talk Results',
        subheading: 'We\'d love to learn more about your goals and show you what\'s possible.',
        ctaText: 'Book Discovery Call',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const eventCollaboration: ProposalTemplate = {
  id: 'tpl-event',
  name: 'Event Collaboration',
  description: 'Event concept, logistics, audience data, and partnership structure.',
  category: 'event',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Partner Name',
        headline: 'Co-Hosted Event Proposal',
        subheadline: 'A shared experience that brings our communities together.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'The Concept',
        body: 'An exclusive, co-branded event designed to bring together our combined audiences for an experience that drives awareness, engagement, and lasting brand affinity. This is more than an event — it\'s a platform for both brands to connect with high-value attendees.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Expected Reach',
        stats: [
          { value: 500, suffix: '+', label: 'Attendees', description: 'Curated guest list from both communities' },
          { value: 50, suffix: 'K', label: 'Social Impressions', description: 'Projected across event promotion' },
          { value: 85, suffix: '%', label: 'Decision Makers', description: 'Director-level and above' },
          { value: 12, label: 'Media Partners', description: 'Committed to covering the event' },
        ],
      },
    },
    {
      id: 'tpl-4', type: 'bullet-list', enabled: true, transition: 'slide-up',
      content: {
        heading: 'What\'s Included',
        subheading: 'Your partnership covers',
        items: [
          'Co-branding on all event collateral, signage, and digital promotion',
          'Speaking slot or panel participation for your team',
          'Dedicated activation space for product demos or experiences',
          'Full attendee list with opt-in contact data post-event',
          'Professional photography and video content for your channels',
        ],
      },
    },
    {
      id: 'tpl-5', type: 'timeline', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Event Timeline',
        milestones: [
          { date: '8 Weeks Out', title: 'Planning & Branding', description: 'Finalize concept, venue, and co-branded materials.' },
          { date: '4 Weeks Out', title: 'Promotion Launch', description: 'Joint marketing campaign across email, social, and PR.' },
          { date: 'Event Day', title: 'Execute', description: 'Full production, activations, and content capture.' },
          { date: 'Post-Event', title: 'Follow-Up', description: 'Attendee data share, content distribution, and impact report.' },
        ],
      },
    },
    {
      id: 'tpl-6', type: 'table', enabled: true, transition: 'fade',
      content: {
        heading: 'Investment & Responsibilities',
        description: 'Shared costs and ownership.',
        columns: ['Item', 'Your Contribution', 'Our Contribution'],
        rows: [
          ['Venue & Production', 'Co-fund (50%)', 'Co-fund (50%) + manage logistics'],
          ['Marketing & Promotion', 'Promote to your audience', 'Creative, paid media, PR'],
          ['Content & Media', 'Brand assets', 'Production, editing, distribution'],
          ['Guest List', 'Invite your VIPs', 'Invite our community + media'],
        ],
      },
    },
    {
      id: 'tpl-7', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Let\'s Make It Happen',
        subheading: 'We\'re excited about this collaboration. Let\'s align on timing and details.',
        ctaText: 'Set Up Planning Call',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const minimalPitch: ProposalTemplate = {
  id: 'tpl-minimal',
  name: 'Minimal Pitch',
  description: 'Clean and concise — just the essentials for a quick, compelling pitch.',
  category: 'general',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Partner Company',
        headline: 'A Proposal',
        subheadline: 'Simple. Clear. Actionable.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'The Idea',
        body: 'A brief, focused summary of what we\'re proposing and why it matters. Replace this with your pitch — keep it concise, direct, and compelling.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'bullet-list', enabled: true, transition: 'slide-up',
      content: {
        heading: 'Key Points',
        items: [
          'The core value proposition in one sentence',
          'Why now — the urgency or opportunity',
          'What makes this different from alternatives',
          'The expected outcome or ROI',
        ],
      },
    },
    {
      id: 'tpl-4', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Interested?',
        subheading: 'Let\'s talk.',
        ctaText: 'Get in Touch',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

const caseStudyShowcase: ProposalTemplate = {
  id: 'tpl-case-study',
  name: 'Case Study Showcase',
  description: 'Lead with results — a data-driven case study to build trust and credibility.',
  category: 'sales',
  themeId: 'dark-minimal',
  slides: [
    {
      id: 'tpl-1', type: 'title', enabled: true, transition: 'fade',
      content: {
        partnerName: 'Prospect Name',
        headline: 'How We Delivered Results',
        subheadline: 'A real-world example of what\'s possible.',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      },
    },
    {
      id: 'tpl-2', type: 'intro', enabled: true, transition: 'slide-up',
      content: {
        heading: 'The Client',
        body: 'A brief profile of the client — their industry, size, and the challenge they came to us with. Set context so the reader can see themselves in this story.',
        imageLayout: 'constrained',
        imagePosition: 'right',
      },
    },
    {
      id: 'tpl-3', type: 'comparison', enabled: true, transition: 'slide-left',
      content: {
        heading: 'Before & After',
        before: {
          label: 'The Challenge',
          items: [
            'Declining conversion rates despite increasing ad spend',
            'No visibility into which channels drove revenue',
            'Manual reporting taking 10+ hours per week',
            'Customer churn accelerating quarter over quarter',
          ],
        },
        after: {
          label: 'The Result',
          items: [
            'Conversion rate improved by 47% in 90 days',
            'Full-funnel attribution across all channels',
            'Automated dashboards saving 40+ hours per month',
            'Churn reduced by 32% through proactive retention',
          ],
        },
      },
    },
    {
      id: 'tpl-4', type: 'stats', enabled: true, transition: 'slide-up',
      content: {
        heading: 'The Numbers',
        stats: [
          { value: 47, suffix: '%', label: 'Conversion Lift', description: 'Within first 90 days' },
          { value: 32, suffix: '%', label: 'Churn Reduction', description: 'Quarter over quarter improvement' },
          { value: 40, suffix: 'hrs', label: 'Time Saved Monthly', description: 'Through automation' },
          { value: 3.8, suffix: 'x', label: 'ROI', description: 'First-year return on investment' },
        ],
      },
    },
    {
      id: 'tpl-5', type: 'testimonial', enabled: true, transition: 'scale',
      content: {
        quote: 'The results speak for themselves. What impressed us most was how quickly the team understood our business and delivered a solution that actually worked.',
        author: 'Morgan Blake',
        role: 'CEO',
        company: 'Veritas Digital',
      },
    },
    {
      id: 'tpl-6', type: 'closing', enabled: true, transition: 'fade',
      content: {
        heading: 'Ready for Similar Results?',
        subheading: 'Let\'s discuss how we can replicate this success for your business.',
        ctaText: 'Start the Conversation',
        ctaUrl: '',
        contactName: 'Your Name',
        contactEmail: 'you@company.com',
      },
    },
  ],
};

// ─── Exports ───────────────────────────────────────────────────────────────────

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  partnershipProposal,
  salesProposal,
  sponsorshipDeck,
  agencyPitch,
  eventCollaboration,
  caseStudyShowcase,
  minimalPitch,
];

export function getTemplateSlidesForProposal(
  templateId: string,
  seed: ProposalSeedData = {},
): { slides: SlideConfig[]; themeId: ThemeId } | null {
  const template = PROPOSAL_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const slides = applySeed(freshIds(template.slides), seed);
  return { slides, themeId: seed.themeId ?? template.themeId };
}

export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'sales', label: 'Sales' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'agency', label: 'Agency' },
  { value: 'event', label: 'Event' },
  { value: 'general', label: 'General' },
] as const;
