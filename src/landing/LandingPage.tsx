import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'motion/react';
import { supabase } from '../supabaseClient';
import { DEMO_PROPOSAL_SLUG } from '../data/demoProposal';
import { BrandLogo } from '../shared/components/BrandLogo';
import { BrandWordmark } from '../shared/components/BrandWordmark';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return { ref, inView };
}

const revealUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.58,
      delay,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  }),
};

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top, behavior: 'smooth' });
}

function NavBar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = [
    { id: 'workflow', label: 'Workflow' },
    { id: 'capabilities', label: 'Capabilities' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      style={{
        background: scrolled ? 'var(--app-bg-overlay)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--app-border-subtle)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        transition: 'all 180ms ease-out',
      }}
    >
      <div className="app-section-frame flex h-16 items-center justify-between gap-6">
        <Link to="/" aria-label="Handshake home" className="inline-flex items-center gap-3">
          <BrandLogo variant="light" className="h-8 w-8" />
          <BrandWordmark variant="light" className="h-4 w-auto" />
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="font-brand-mono text-[11px] uppercase tracking-[0.14em] text-[var(--app-text-muted)] transition-colors hover:text-[var(--app-text-primary)]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] px-3 py-2 text-sm text-[var(--app-text-secondary)] transition-colors hover:text-[var(--app-text-primary)] sm:inline-flex"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('waitlist')}
            className="rounded-[var(--app-radius-sm)] border border-primary/15 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_10px_22px_rgba(245,78,0,0.14)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            Join beta
          </button>
        </div>
      </div>
    </header>
  );
}

function StudioWindow({
  title,
  eyebrow,
  children,
  dark = false,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div
      className="overflow-hidden rounded-[14px] border"
      style={{
        background: dark ? '#181713' : 'rgba(247,247,244,0.88)',
        borderColor: dark ? 'rgba(247,247,244,0.08)' : 'var(--app-border-subtle)',
        boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.28)' : 'var(--app-shadow-elevated)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{
          borderColor: dark ? 'rgba(247,247,244,0.08)' : 'var(--app-border-subtle)',
          color: dark ? 'rgba(247,247,244,0.7)' : 'var(--app-text-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--app-accent)]" />
          <span className="font-brand-mono text-[11px] uppercase tracking-[0.14em]">{eyebrow}</span>
        </div>
        <span className="text-xs">{title}</span>
      </div>
      {children}
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <motion.div
        initial={{ opacity: 0, x: 26 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.72, ease: [0.23, 1, 0.32, 1], delay: 0.18 }}
        className="relative"
      >
        <StudioWindow title="Proposal workspace" eyebrow="Studio">
          <div className="grid gap-0 md:grid-cols-[210px_1fr]">
            <aside className="border-r border-[var(--app-border-subtle)] bg-[rgba(230,229,224,0.7)] p-4">
              <div className="mb-4 rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.88)] p-3">
                <p className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                  Active proposal
                </p>
                <p className="mt-2 font-brand-serif text-lg tracking-[-0.04em] text-[var(--app-text-strong)]">
                  Acme / Growth Partnership
                </p>
              </div>
              {['Narrative', 'Slides', 'Sharing', 'Analytics'].map((item, index) => (
                <div
                  key={item}
                  className="mb-2 flex items-center justify-between rounded-[var(--app-radius-sm)] px-3 py-2"
                  style={{
                    background: index === 1 ? 'var(--app-accent-muted)' : 'transparent',
                    color: index === 1 ? 'var(--app-text-strong)' : 'var(--app-text-secondary)',
                  }}
                >
                  <span className="text-sm">{item}</span>
                  <span className="font-brand-mono text-[10px] uppercase tracking-[0.14em]">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </aside>

            <div className="grid gap-3 p-4">
              <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.94)] p-4">
                <p className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                  Narrative input
                </p>
                <div className="mt-3 space-y-2 font-brand-mono text-[12px] leading-6 text-[var(--app-text-secondary)]">
                  <div># Partnership proposal</div>
                  <div>## Opportunity</div>
                  <div>- 12 target markets</div>
                  <div>- Shared GTM launch in Q3</div>
                  <div>- Live pricing + proof points</div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1.3fr_1fr]">
                <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[#171713] p-4 text-[var(--app-text-inverse)]">
                  <p className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(247,247,244,0.56)]">
                    Live preview
                  </p>
                  <div className="mt-4 rounded-[var(--app-radius-sm)] border border-[rgba(247,247,244,0.08)] bg-[rgba(247,247,244,0.04)] p-4">
                    <p className="font-brand-serif text-[28px] leading-[1.02] tracking-[-0.05em]">
                      A proposal your partner actually revisits.
                    </p>
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        ['4.2M', 'pipeline'],
                        ['12', 'markets'],
                        ['3x', 'roi'],
                      ].map(([value, label]) => (
                        <div key={label} className="rounded-[var(--app-radius-sm)] bg-[rgba(247,247,244,0.06)] p-3">
                          <div className="font-brand-serif text-xl text-[var(--app-accent)]">{value}</div>
                          <div className="mt-1 font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(247,247,244,0.56)]">
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.94)] p-4">
                    <p className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                      Share
                    </p>
                    <p className="mt-2 text-sm text-[var(--app-text-secondary)]">
                      Link-based review, password gating, short URLs, analytics.
                    </p>
                  </div>
                  <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(230,229,224,0.82)] p-4">
                    <p className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
                      Always current
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[var(--app-text-primary)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--app-success)]" />
                      Recipients always see the latest version.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StudioWindow>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.58, ease: [0.23, 1, 0.32, 1], delay: 0.42 }}
          className="absolute -bottom-10 -left-4 hidden w-[220px] md:block"
        >
          <StudioWindow title="Readiness" eyebrow="Signals" dark>
            <div className="space-y-3 p-4 text-[var(--app-text-inverse)]">
              {[
                ['Structure', 'Complete'],
                ['Branding', 'Applied'],
                ['Access', 'Protected'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[rgba(247,247,244,0.08)] pb-2 text-sm last:border-b-0 last:pb-0">
                  <span className="text-[rgba(247,247,244,0.62)]">{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </StudioWindow>
        </motion.div>
      </motion.div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="overflow-hidden pt-28 pb-18 md:pt-34 md:pb-24">
      <div className="app-section-frame grid gap-12 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:items-center">
        <div>
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0}
            variants={revealUp}
            className="app-kicker"
          >
            Warm ivory software studio
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.08}
            variants={revealUp}
            className="app-display mt-4 max-w-[9ch]"
          >
            Proposal software with product-grade presence.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.16}
            variants={revealUp}
            className="app-copy mt-6 max-w-[34rem] text-[1.06rem]"
          >
            Handshake turns working narrative into live proposal pages that feel intentional from the first scroll.
            Write fast, shape the story, ship a polished link, and keep it current after it lands in someone else&apos;s inbox.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.24}
            variants={revealUp}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              type="button"
              onClick={() => scrollToSection('waitlist')}
              className="rounded-[var(--app-radius-sm)] border border-primary/15 bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[0_16px_28px_rgba(245,78,0,0.18)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              Join the beta
            </button>
            <a
              href={`/p/${DEMO_PROPOSAL_SLUG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[var(--app-border-strong)] bg-[rgba(247,247,244,0.88)] px-5 py-3 text-sm text-[var(--app-text-primary)] transition-colors hover:bg-[var(--app-bg-elevated)]"
            >
              View a live proposal
              <span aria-hidden="true">→</span>
            </a>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.32}
            variants={revealUp}
            className="mt-10 grid gap-3 sm:grid-cols-3"
          >
            {[
              ['Markdown in, structure out', 'Narrative turns into sections, slides, and sharing states.'],
              ['Share once, update later', 'Every proposal stays live at the same URL.'],
              ['Built for non-designers', 'Crafted layouts without a deck-builder learning curve.'],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[var(--app-radius-md)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.82)] p-4 shadow-[var(--app-shadow-soft)]"
              >
                <p className="font-brand-serif text-lg tracking-[-0.03em] text-[var(--app-text-strong)]">
                  {title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--app-text-secondary)]">{body}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <HeroPreview />
      </div>
    </section>
  );
}

function ProductFramingSection() {
  const { ref, inView } = useReveal();

  return (
    <section className="py-20">
      <div ref={ref} className="app-section-frame grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="rounded-[var(--app-radius-lg)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.8)] p-6 shadow-[var(--app-shadow-elevated)] md:p-8"
        >
          <p className="app-kicker">Why teams switch</p>
          <h2 className="app-heading mt-4 max-w-[13ch]">
            Static attachments flatten work that deserves a real interface.
          </h2>
          <p className="app-copy mt-5 max-w-[42rem]">
            Most proposal workflows end with a dead file. Handshake keeps the speed of document-first creation but turns the final output into a living surface: one link, clean hierarchy, controlled pacing, and a better read for the person on the other side.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.1}
          variants={revealUp}
          className="grid gap-3"
        >
          {[
            ['12 markets', 'Modeled launch targets can live next to narrative, not in backup slides.'],
            ['3x ROI', 'Outcome-heavy proof points stay visible instead of hiding in appendix pages.'],
            ['Always current', 'Fix pricing, timing, or proof later without resending a deck.'],
          ].map(([value, body], index) => (
            <div
              key={value}
              className="rounded-[var(--app-radius-md)] border p-5"
              style={{
                background: index === 1 ? 'var(--app-bg-elevated)' : 'rgba(247,247,244,0.72)',
                borderColor: 'var(--app-border-subtle)',
              }}
            >
              <p className="font-brand-serif text-[2rem] leading-none tracking-[-0.05em] text-[var(--app-text-strong)]">
                {value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--app-text-secondary)]">{body}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const { ref, inView } = useReveal();
  const steps = [
    {
      id: '01',
      title: 'Start with working narrative',
      body: 'Paste markdown, write directly in the editor, or shape a proposal from structured fields. Handshake begins with content, not decoration.',
    },
    {
      id: '02',
      title: 'Refine the live surface',
      body: 'Choose the right story rhythm, adjust slides, apply brand controls, and tune sharing settings in one place.',
    },
    {
      id: '03',
      title: 'Send one durable link',
      body: 'Recipients open a polished proposal page instead of a static attachment, and future edits are already reflected there.',
    },
  ];

  return (
    <section id="workflow" className="py-20">
      <div ref={ref} className="app-section-frame">
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="app-kicker"
        >
          Workflow
        </motion.p>
        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.08}
          variants={revealUp}
          className="app-heading mt-4 max-w-[12ch]"
        >
          A proposal workflow designed like a software tool, not a template gallery.
        </motion.h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              custom={0.1 + index * 0.08}
              variants={revealUp}
              className="rounded-[var(--app-radius-lg)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.82)] p-5 shadow-[var(--app-shadow-soft)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-brand-serif text-[2.4rem] leading-none tracking-[-0.05em] text-[rgba(20,20,20,0.18)]">
                  {step.id}
                </span>
                <span className="font-brand-mono text-[10px] uppercase tracking-[0.16em] text-[var(--app-accent)]">
                  Step
                </span>
              </div>
              <h3 className="mt-6 font-brand-serif text-[1.4rem] leading-[1.05] tracking-[-0.04em] text-[var(--app-text-strong)]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--app-text-secondary)]">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilityVisualOne() {
  return (
    <StudioWindow title="Narrative editor" eyebrow="Compose" dark>
      <div className="space-y-3 p-4 text-[var(--app-text-inverse)]">
        <div className="rounded-[var(--app-radius-sm)] bg-[rgba(247,247,244,0.04)] p-4">
          <div className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(247,247,244,0.48)]">
            Proposal outline
          </div>
          <div className="mt-3 space-y-2 font-brand-mono text-sm text-[rgba(247,247,244,0.82)]">
            <div># Narrative</div>
            <div>## Opportunity</div>
            <div>## Commercial model</div>
            <div>## Launch timing</div>
          </div>
        </div>
      </div>
    </StudioWindow>
  );
}

function CapabilityVisualTwo() {
  return (
    <StudioWindow title="Sharing controls" eyebrow="Ship">
      <div className="grid gap-3 p-4">
        <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(230,229,224,0.76)] p-4">
          <div className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            Access
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-[var(--app-text-primary)]">
            <span>Password gate</span>
            <span className="rounded-full bg-[var(--app-success)]/12 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--app-success)]">
              On
            </span>
          </div>
        </div>
        <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.94)] p-4">
          <div className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            Link
          </div>
          <div className="mt-3 font-brand-mono text-xs text-[var(--app-text-secondary)]">
            handshake.design/s/acme-q3-launch
          </div>
        </div>
      </div>
    </StudioWindow>
  );
}

function CapabilityVisualThree() {
  return (
    <StudioWindow title="Brand system" eyebrow="Apply">
      <div className="grid gap-3 p-4">
        <div className="flex gap-2">
          {['#f7f7f4', '#e6e5e0', '#262510', '#f54e00'].map((swatch) => (
            <div
              key={swatch}
              className="h-12 flex-1 rounded-[var(--app-radius-sm)] border"
              style={{ background: swatch, borderColor: 'var(--app-border-subtle)' }}
            />
          ))}
        </div>
        <div className="rounded-[var(--app-radius-sm)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.92)] p-4">
          <div className="font-brand-mono text-[10px] uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            Applied across editor and delivery
          </div>
          <div className="mt-3 flex items-center gap-3">
            <BrandLogo variant="light" className="h-9 w-9" />
            <BrandWordmark variant="light" className="h-4 w-auto" />
          </div>
        </div>
      </div>
    </StudioWindow>
  );
}

function CapabilitySection() {
  const { ref, inView } = useReveal();
  const capabilities = [
    {
      label: 'Compose',
      title: 'Content-first creation with structure baked in.',
      body: 'The product starts from your working narrative and turns it into proposal architecture. You stay focused on the pitch while Handshake keeps the surface coherent.',
      visual: <CapabilityVisualOne />,
    },
    {
      label: 'Ship',
      title: 'Distribution controls that belong inside the tool.',
      body: 'Sharing is part of the proposal build, not an afterthought. Protect access, shorten links, and keep delivery modes close to the content that needs them.',
      visual: <CapabilityVisualTwo />,
    },
    {
      label: 'Brand',
      title: 'A studio-grade visual language without manual deck design.',
      body: 'Color, type, logo, and page rhythm can stay aligned from editor to final recipient experience, even when the person sending the proposal is not a designer.',
      visual: <CapabilityVisualThree />,
    },
  ];

  return (
    <section id="capabilities" className="py-20">
      <div ref={ref} className="app-section-frame space-y-6">
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="app-kicker"
        >
          Capabilities
        </motion.p>
        {capabilities.map((capability, index) => (
          <motion.div
            key={capability.label}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.08 + index * 0.08}
            variants={revealUp}
            className="grid gap-5 rounded-[var(--app-radius-lg)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.8)] p-5 shadow-[var(--app-shadow-soft)] md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-6"
          >
            <div>
              <p className="app-kicker">{capability.label}</p>
              <h3 className="mt-4 font-brand-serif text-[1.95rem] leading-[1.02] tracking-[-0.05em] text-[var(--app-text-strong)]">
                {capability.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-[var(--app-text-secondary)]">{capability.body}</p>
            </div>
            {capability.visual}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function LiveExampleSection() {
  const { ref, inView } = useReveal();

  return (
    <section className="py-20">
      <div ref={ref} className="app-section-frame">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="overflow-hidden rounded-[var(--app-radius-lg)] border border-[rgba(247,247,244,0.08)] bg-[#171713] px-6 py-8 text-center text-[var(--app-text-inverse)] shadow-[0_28px_60px_rgba(0,0,0,0.28)] md:px-10"
        >
          <p className="app-kicker">Live example</p>
          <h2 className="mt-4 font-brand-serif text-[clamp(2.1rem,4vw,3.4rem)] leading-[0.98] tracking-[-0.05em] text-[var(--app-text-inverse)]">
            See the output in its natural environment.
          </h2>
          <p className="mx-auto mt-4 max-w-[38rem] text-sm leading-7 text-[rgba(247,247,244,0.72)] md:text-base">
            Open a real Handshake proposal and move through the same page structure your recipients will see. No static mockup, no reduced demo shell.
          </p>
          <a
            href={`/p/${DEMO_PROPOSAL_SLUG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-[var(--app-radius-sm)] border border-[rgba(247,247,244,0.1)] bg-[rgba(247,247,244,0.06)] px-5 py-3 text-sm text-[var(--app-text-inverse)] transition-colors hover:bg-[rgba(247,247,244,0.1)]"
          >
            Open the live proposal
            <span aria-hidden="true">↗</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

type PricingTier = 'free' | 'pro' | 'team';

function PricingSection() {
  const { ref, inView } = useReveal();
  const [annualBilling, setAnnualBilling] = useState(true);

  const plans: Array<{
    tier: PricingTier;
    name: string;
    highlight?: boolean;
    audience: string;
    price: { monthly: string; annual: string };
    notes: { monthly: string; annual: string };
    bullets: string[];
  }> = [
    {
      tier: 'free',
      name: 'Free',
      audience: 'For solo operators testing the workflow and sending early proposals.',
      price: { monthly: '$0', annual: '$0' },
      notes: {
        monthly: '3 active proposals, one user, public links.',
        annual: '3 active proposals, one user, public links.',
      },
      bullets: ['Markdown ingest', 'All slide types', 'Live links', 'Built-in Handshake branding'],
    },
    {
      tier: 'pro',
      name: 'Pro',
      highlight: true,
      audience: 'For people who send proposals often and need brand control plus analytics.',
      price: { monthly: '$19', annual: '$16' },
      notes: {
        monthly: 'Per user, billed monthly.',
        annual: '$192 per user, billed annually.',
      },
      bullets: ['Unlimited proposals', 'Workspace branding', 'Analytics + sharing controls', 'No Handshake badge'],
    },
    {
      tier: 'team',
      name: 'Team',
      audience: 'For teams coordinating pipeline, access, templates, and shared review.',
      price: { monthly: '$35', annual: '$29' },
      notes: {
        monthly: 'Per user, billed monthly.',
        annual: '$348 per user, billed annually.',
      },
      bullets: ['Shared workspace', 'Lead capture', 'Template systems', 'Team review + collaboration'],
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div ref={ref} className="app-section-frame">
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="app-kicker"
        >
          Pricing
        </motion.p>
        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.08}
          variants={revealUp}
          className="app-heading mt-4 max-w-[10ch]"
        >
          Three plans, one product posture.
        </motion.h2>
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.16}
          variants={revealUp}
          className="app-copy mt-5 max-w-[42rem]"
        >
          The pricing stays visible, but the page no longer turns into a giant procurement table. Choose the workflow stage you&apos;re in and move.
        </motion.p>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.2}
          variants={revealUp}
          className="mt-8 flex justify-center"
        >
          <div className="relative grid w-full max-w-[320px] grid-cols-2 rounded-full border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.88)] p-1">
            <motion.div
              animate={{ x: annualBilling ? '100%' : '0%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-[var(--app-bg-elevated)]"
            />
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`relative z-10 rounded-full px-4 py-2 text-sm ${annualBilling ? 'text-[var(--app-text-muted)]' : 'text-[var(--app-text-primary)]'}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`relative z-10 rounded-full px-4 py-2 text-sm ${annualBilling ? 'text-[var(--app-text-primary)]' : 'text-[var(--app-text-muted)]'}`}
            >
              Annual
            </button>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan, index) => {
            const price = annualBilling ? plan.price.annual : plan.price.monthly;
            const note = annualBilling ? plan.notes.annual : plan.notes.monthly;

            return (
              <motion.div
                key={plan.tier}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                custom={0.24 + index * 0.08}
                variants={revealUp}
                className="flex h-full flex-col rounded-[var(--app-radius-lg)] border p-5 shadow-[var(--app-shadow-soft)]"
                style={{
                  background: plan.highlight ? '#171713' : 'rgba(247,247,244,0.82)',
                  borderColor: plan.highlight ? 'rgba(245,78,0,0.22)' : 'var(--app-border-subtle)',
                  color: plan.highlight ? 'var(--app-text-inverse)' : 'var(--app-text-primary)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-brand-mono text-[11px] uppercase tracking-[0.14em] opacity-70">{plan.name}</span>
                  {plan.highlight && (
                    <span className="rounded-full bg-[rgba(245,78,0,0.16)] px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--app-accent)]">
                      Core tier
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 opacity-75">{plan.audience}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="font-brand-serif text-[3rem] leading-none tracking-[-0.06em]">{price}</span>
                  <span className="pb-1 text-sm opacity-70">/ user</span>
                </div>
                <p className="mt-2 text-sm opacity-70">{note}</p>
                <ul className="mt-6 space-y-3 text-sm leading-6">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => scrollToSection('waitlist')}
                  className={`mt-8 rounded-[var(--app-radius-sm)] px-4 py-3 text-sm font-medium transition-transform duration-150 hover:-translate-y-0.5 ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-[var(--app-border-strong)] bg-[rgba(247,247,244,0.88)] text-[var(--app-text-primary)]'
                  }`}
                >
                  Join the waitlist
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const { ref, inView } = useReveal();
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: 'What kind of team is Handshake for?',
      answer:
        'Handshake is built for partnership, BD, and sales teams that want proposals to feel more like a living product page than a static attachment.',
    },
    {
      question: 'Can I update a proposal after sharing it?',
      answer:
        'Yes. The proposal lives at one durable URL, so edits made later are reflected without sending a replacement file.',
    },
    {
      question: 'Do I need a designer to get a polished result?',
      answer:
        'No. The product is designed for people who work fast from narrative and need a clean delivery surface without spending time in presentation software.',
    },
    {
      question: 'What sharing controls exist?',
      answer:
        'Public links, short links, password protection, and gated access are all part of the product surface, not bolted on after the fact.',
    },
  ];

  return (
    <section id="faq" className="py-20">
      <div ref={ref} className="app-section-frame">
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="app-kicker"
        >
          FAQ
        </motion.p>
        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.08}
          variants={revealUp}
          className="app-heading mt-4 max-w-[11ch]"
        >
          A few questions teams usually ask before switching.
        </motion.h2>

        <div className="mt-8 space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                custom={0.14 + index * 0.05}
                variants={revealUp}
                className="overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border-subtle)] bg-[rgba(247,247,244,0.82)] shadow-[var(--app-shadow-soft)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-brand-serif text-[1.2rem] leading-[1.12] tracking-[-0.03em] text-[var(--app-text-strong)]">
                    {faq.question}
                  </span>
                  <span
                    className="text-[var(--app-accent)] transition-transform"
                    style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <div className="px-5 pb-5 text-sm leading-7 text-[var(--app-text-secondary)]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WaitlistSection() {
  const { ref, inView } = useReveal();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert({ email: email.toLowerCase().trim(), source: 'landing_page' });

      if (error && error.code !== '23505') {
        throw error;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <section id="waitlist" className="py-20">
      <div ref={ref} className="app-section-frame">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={revealUp}
          className="overflow-hidden rounded-[var(--app-radius-lg)] border border-[rgba(247,247,244,0.08)] bg-[#171713] px-6 py-8 text-center text-[var(--app-text-inverse)] shadow-[0_28px_60px_rgba(0,0,0,0.28)] md:px-10 md:py-10"
        >
          <p className="app-kicker">Join the waitlist</p>
          <h2 className="mt-4 font-brand-serif text-[clamp(2rem,4vw,3.5rem)] leading-[0.98] tracking-[-0.05em] text-[var(--app-text-inverse)]">
            Ready to stop shipping dead files?
          </h2>
          <p className="mx-auto mt-4 max-w-[36rem] text-sm leading-7 text-[rgba(247,247,244,0.72)] md:text-base">
            Join the beta and be the first to use Handshake with the new studio-style experience across the app.
          </p>

          <div className="mx-auto mt-8 max-w-[620px]">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="rounded-[var(--app-radius-md)] border border-[rgba(79,151,120,0.36)] bg-[rgba(79,151,120,0.1)] px-6 py-5"
                >
                  <div className="font-brand-serif text-2xl tracking-[-0.04em]">You&apos;re on the list.</div>
                  <div className="mt-2 text-sm text-[rgba(247,247,244,0.72)]">We&apos;ll reach out as soon as access opens.</div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setStatus('idle');
                        setErrorMsg('');
                      }}
                      placeholder="you@company.com"
                      className="min-w-0 flex-1 rounded-[var(--app-radius-sm)] border border-[rgba(247,247,244,0.14)] bg-[rgba(247,247,244,0.06)] px-4 py-3 text-sm text-[var(--app-text-inverse)] outline-none placeholder:text-[rgba(247,247,244,0.42)] focus:border-[rgba(255,105,48,0.48)]"
                    />
                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="rounded-[var(--app-radius-sm)] bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-150 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
                    >
                      {status === 'loading' ? 'Joining…' : 'Get early access'}
                    </button>
                  </div>
                  {status === 'error' && (
                    <p className="text-left text-sm text-[#ffb3a1]">{errorMsg}</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-4 font-brand-mono text-[11px] uppercase tracking-[0.16em] text-[rgba(247,247,244,0.42)]">
            No credit card required at launch
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--app-border-subtle)] py-8">
      <div className="app-section-frame flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo variant="light" className="h-7 w-7" />
          <BrandWordmark variant="light" className="h-4 w-auto" />
        </div>
        <div className="text-sm text-[var(--app-text-muted)]">© 2026 Handshake. All rights reserved.</div>
        <div className="flex items-center gap-5 text-sm text-[var(--app-text-muted)]">
          <Link to="/terms" className="transition-colors hover:text-[var(--app-text-primary)]">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-[var(--app-text-primary)]">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="app-shell">
      <NavBar />
      <main>
        <HeroSection />
        <ProductFramingSection />
        <WorkflowSection />
        <CapabilitySection />
        <LiveExampleSection />
        <PricingSection />
        <FAQSection />
        <WaitlistSection />
      </main>
      <Footer />
    </div>
  );
}
