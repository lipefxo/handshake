import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bgPrimary: '#FAFAF7',
  bgSecondary: '#F2F1ED',
  bgDark: '#0C0C0C',
  bgDarkAlt: '#111111',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textOnDark: '#F0EDE8',
  textMuted: '#9A9590',
  accent: '#D4785C',
  accentHover: '#C06A50',
  border: '#E5E3DE',
  borderDark: '#2A2A2A',
} as const;

const serif = "'Libre Baskerville', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

// ─── Scroll-reveal hook ───────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return { ref, inView };
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const, delay },
  }),
};

// ─── Browser mockup ───────────────────────────────────────────────────────────
function BrowserMockup() {
  return (
    <div
      style={{
        background: '#0C0C0C',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.14)',
        transform: 'rotate(1.5deg)',
        border: `1px solid ${C.borderDark}`,
        maxWidth: 520,
        width: '100%',
      }}
    >
      {/* Chrome bar */}
      <div
        style={{
          background: '#1a1a1a',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid #2a2a2a',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div
          style={{
            flex: 1,
            background: '#111',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#555',
            fontSize: 11,
            fontFamily: sans,
            marginLeft: 8,
          }}
        >
          handshake.so/p/acme-partnership-2026
        </div>
      </div>
      {/* Slide content */}
      <div
        style={{
          padding: '40px 36px 36px',
          minHeight: 280,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient orb */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.accent}28 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Content */}
        <div
          style={{
            display: 'inline-block',
            background: `${C.accent}18`,
            color: C.accent,
            fontSize: 11,
            fontFamily: sans,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: 4,
            marginBottom: 20,
            border: `1px solid ${C.accent}30`,
          }}
        >
          Partnership Proposal · 2026
        </div>
        <div
          style={{
            fontFamily: serif,
            fontSize: 28,
            fontWeight: 700,
            color: C.textOnDark,
            lineHeight: 1.25,
            marginBottom: 14,
          }}
        >
          Growing Together
          <br />
          with Acme Corp
        </div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 14,
            color: C.textMuted,
            lineHeight: 1.6,
            marginBottom: 28,
            maxWidth: 320,
          }}
        >
          A strategic partnership to expand reach across 12 new markets and drive $4.2M in combined revenue.
        </div>
        {/* Fake stats */}
        <div style={{ display: 'flex', gap: 20 }}>
          {[{ val: '4.2M', label: 'Revenue' }, { val: '12', label: 'Markets' }, { val: '3x', label: 'ROI' }].map(
            ({ val, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 22,
                    fontWeight: 700,
                    color: C.accent,
                  }}
                >
                  {val}
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, color: C.textMuted }}>
                  {label}
                </div>
              </div>
            )
          )}
        </div>
        {/* Slide indicator dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 18,
            display: 'flex',
            gap: 5,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: i === 1 ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === 1 ? C.accent : '#2a2a2a',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };
  const goToAdmin = () => {
    setMobileOpen(false);
    window.location.href = '/admin';
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(250, 250, 247, 0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Wordmark */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            fontFamily: serif,
            fontSize: 20,
            fontWeight: 700,
            color: C.textPrimary,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Handshake
        </button>

        {/* Desktop nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 32,
          }}
          className="landing-desktop-nav"
        >
          {[
            { label: 'How it Works', id: 'how-it-works' },
            { label: 'Features', id: 'features' },
            { label: 'Pricing', id: 'pricing' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 400,
                color: C.textSecondary,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.textPrimary)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.textSecondary)}
            >
              {label}
            </button>
          ))}
          <button
            onClick={goToAdmin}
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 500,
              color: C.textPrimary,
              background: 'transparent',
              border: `1px solid ${C.border}`,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = C.bgSecondary)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = 'transparent')}
          >
            Login
          </button>
          <button
            onClick={() => scrollTo('waitlist')}
            style={{
              fontFamily: sans,
              fontSize: 14,
              fontWeight: 500,
              color: '#fff',
              background: C.accent,
              border: 'none',
              cursor: 'pointer',
              padding: '9px 20px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.background = C.accentHover)}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.background = C.accent)}
          >
            Get Early Access
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="landing-hamburger"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'none',
            flexDirection: 'column',
            gap: 5,
          }}
          aria-label="Toggle menu"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 22,
                height: 1.5,
                background: C.textPrimary,
                transition: 'all 0.3s',
                transformOrigin: 'center',
                transform:
                  mobileOpen && i === 0
                    ? 'rotate(45deg) translate(4.5px, 4.5px)'
                    : mobileOpen && i === 1
                    ? 'scaleX(0)'
                    : mobileOpen && i === 2
                    ? 'rotate(-45deg) translate(4.5px, -4.5px)'
                    : 'none',
              }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(250, 250, 247, 0.97)',
              backdropFilter: 'blur(12px)',
              borderTop: `1px solid ${C.border}`,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'How it Works', id: 'how-it-works' },
                { label: 'Features', id: 'features' },
                { label: 'Pricing', id: 'pricing' },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  style={{
                    fontFamily: sans,
                    fontSize: 15,
                    color: C.textSecondary,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={goToAdmin}
                style={{
                  fontFamily: sans,
                  fontSize: 15,
                  fontWeight: 500,
                  color: C.textPrimary,
                  background: 'transparent',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  padding: '10px 20px',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                Login
              </button>
              <button
                onClick={() => scrollTo('waitlist')}
                style={{
                  fontFamily: sans,
                  fontSize: 15,
                  fontWeight: 500,
                  color: '#fff',
                  background: C.accent,
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 20px',
                  borderRadius: 8,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Get Early Access
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSection() {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      style={{
        background: C.bgPrimary,
        paddingTop: 140,
        paddingBottom: 100,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Subtle warm gradient */}
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}0C 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
          alignItems: 'center',
        }}
        className="landing-hero-grid"
      >
        {/* Text */}
        <div>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            style={{
              display: 'inline-block',
              fontFamily: sans,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.accent,
              marginBottom: 24,
              padding: '5px 12px',
              background: `${C.accent}10`,
              border: `1px solid ${C.accent}25`,
              borderRadius: 4,
            }}
          >
            Now in private beta
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            custom={0.08}
            variants={fadeUp}
            style={{
              fontFamily: serif,
              fontSize: 'clamp(44px, 5.5vw, 68px)',
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: 24,
            }}
          >
            Beautiful proposals.
            <br />
            Sent in minutes.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={0.18}
            variants={fadeUp}
            style={{
              fontFamily: sans,
              fontSize: 20,
              fontWeight: 300,
              color: C.textSecondary,
              lineHeight: 1.65,
              maxWidth: 480,
              marginBottom: 40,
            }}
          >
            Handshake turns your content into stunning, animated proposal pages
            your partners will actually remember. No design skills required.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.28}
            variants={fadeUp}
            style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}
          >
            <button
              onClick={() => scrollTo('waitlist')}
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 500,
                color: '#fff',
                background: C.accent,
                border: 'none',
                cursor: 'pointer',
                padding: '13px 28px',
                borderRadius: 9,
                transition: 'all 0.2s',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = C.accentHover;
                (e.target as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = C.accent;
                (e.target as HTMLElement).style.transform = 'none';
              }}
            >
              Get Early Access
            </button>
            <button
              onClick={() => scrollTo('live-example')}
              style={{
                fontFamily: sans,
                fontSize: 15,
                fontWeight: 400,
                color: C.textPrimary,
                background: 'none',
                border: `1px solid ${C.border}`,
                cursor: 'pointer',
                padding: '13px 28px',
                borderRadius: 9,
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#c8c5be')}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.borderColor = C.border)
              }
            >
              See a Live Example
              <span style={{ fontSize: 16 }}>→</span>
            </button>
          </motion.div>
        </div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          className="landing-hero-visual"
          style={{ display: 'flex', justifyContent: 'center' }}
        >
          <BrowserMockup />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Social proof bar ─────────────────────────────────────────────────────────
function SocialProofBar() {
  return (
    <div
      style={{
        background: C.bgPrimary,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 32px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: sans,
          fontSize: 13,
          color: C.textSecondary,
          letterSpacing: '0.02em',
        }}
      >
        Built for partnership, sales, and business development teams who are tired of sending PDFs and slide decks.
      </p>
    </div>
  );
}

// ─── Problem section ──────────────────────────────────────────────────────────
function ProblemSection() {
  const { ref, inView } = useReveal();

  return (
    <section
      style={{
        background: C.bgDark,
        padding: '120px 32px',
      }}
    >
      <div
        ref={ref}
        style={{
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.accent,
            marginBottom: 28,
          }}
        >
          The problem
        </motion.div>

        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.08}
          variants={fadeUp}
          style={{
            fontFamily: serif,
            fontSize: 'clamp(34px, 4vw, 52px)',
            fontWeight: 700,
            color: C.textOnDark,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 28,
          }}
        >
          Your proposals deserve better
          <br />
          than a PDF attachment.
        </motion.h2>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.16}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 18,
            fontWeight: 300,
            color: C.textMuted,
            lineHeight: 1.75,
          }}
        >
          <p style={{ marginBottom: 20 }}>
            You spend hours crafting the perfect pitch, then send it as a static file that gets lost in an inbox,
            opened once, and forgotten.
          </p>
          <p style={{ color: `${C.textOnDark}cc` }}>
            What if every proposal you sent felt like opening a beautifully designed website — with animations,
            transitions, and a link your partners actually revisit?
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const { ref, inView } = useReveal();

  const steps = [
    {
      num: '01',
      title: 'Write or paste your content',
      desc: 'Drop in markdown or fill out a simple form. The app structures it into the right slides automatically.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="3" rx="1.5" fill={C.accent} opacity="0.3" />
          <rect x="4" y="13" width="18" height="3" rx="1.5" fill={C.accent} opacity="0.5" />
          <rect x="4" y="20" width="22" height="3" rx="1.5" fill={C.accent} opacity="0.7" />
          <circle cx="26" cy="24" r="6" fill={C.accent} opacity="0.15" />
          <path d="M23 24l2 2 3.5-3.5" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Customize & theme your slides',
      desc: 'Choose a preset theme, rearrange slides, swap assets. Looks polished in minutes, not hours.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="18" rx="3" stroke={C.accent} strokeWidth="1.5" opacity="0.4" />
          <rect x="8" y="8" width="8" height="6" rx="1.5" fill={C.accent} opacity="0.3" />
          <rect x="18" y="8" width="6" height="2.5" rx="1" fill={C.accent} opacity="0.5" />
          <rect x="18" y="12" width="4" height="2.5" rx="1" fill={C.accent} opacity="0.3" />
          <circle cx="10" cy="26" r="3" fill={C.accent} opacity="0.4" />
          <circle cx="18" cy="26" r="3" fill={`${C.accent}80`} />
          <circle cx="26" cy="26" r="3" fill={C.accent} opacity="0.2" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Share a link & track views',
      desc: 'Every proposal gets a unique URL. See who views it, how long they stay, and which slides land.',
      icon: (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="24" cy="8" r="4" stroke={C.accent} strokeWidth="1.5" opacity="0.6" />
          <circle cx="8" cy="16" r="4" stroke={C.accent} strokeWidth="1.5" opacity="0.4" />
          <circle cx="24" cy="24" r="4" stroke={C.accent} strokeWidth="1.5" opacity="0.3" />
          <path d="M12 14.5l8-5M12 17.5l8 5" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" style={{ background: C.bgPrimary, padding: '120px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={ref}>
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0}
            variants={fadeUp}
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.accent,
              marginBottom: 16,
            }}
          >
            How it works
          </motion.div>
          <motion.h2
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.08}
            variants={fadeUp}
            style={{
              fontFamily: serif,
              fontSize: 'clamp(30px, 3.5vw, 46px)',
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: 72,
              maxWidth: 560,
            }}
          >
            From content to presentation in three steps.
          </motion.h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 48,
          }}
          className="landing-steps-grid"
        >
          {steps.map(({ num, title, desc, icon }, i) => {
            const { ref: stepRef, inView: stepInView } = useReveal();
            return (
              <motion.div
                key={num}
                ref={stepRef}
                initial="hidden"
                animate={stepInView ? 'visible' : 'hidden'}
                custom={i * 0.12}
                variants={fadeUp}
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 32,
                }}
              >
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 48,
                    fontWeight: 700,
                    color: `${C.accent}35`,
                    lineHeight: 1,
                    marginBottom: 20,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {num}
                </div>
                <div style={{ marginBottom: 16 }}>{icon}</div>
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.textPrimary,
                    lineHeight: 1.3,
                    marginBottom: 12,
                  }}
                >
                  {title}
                </div>
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 15,
                    fontWeight: 300,
                    color: C.textSecondary,
                    lineHeight: 1.65,
                  }}
                >
                  {desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Feature mockup helpers ───────────────────────────────────────────────────
function MarkdownMockup() {
  const lines = [
    { type: 'h1', content: '# Partnership Proposal' },
    { type: 'blank', content: '' },
    { type: 'h2', content: '## About Us' },
    { type: 'body', content: 'SecureBags is a leading B2B...' },
    { type: 'body', content: 'Founded in 2018 with 200+ clients.' },
    { type: 'blank', content: '' },
    { type: 'h2', content: '## Key Metrics' },
    { type: 'item', content: '- **$4.2M** combined revenue' },
    { type: 'item', content: '- **12** new markets' },
    { type: 'item', content: '- **3x** average ROI' },
  ];
  return (
    <div
      style={{
        background: '#0f0f0f',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${C.borderDark}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 12.5,
        lineHeight: 1.7,
      }}
    >
      <div style={{ background: '#1a1a1a', padding: '10px 14px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: '1px solid #2a2a2a' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
        ))}
        <span style={{ color: '#555', marginLeft: 8, fontSize: 11 }}>proposal.md</span>
      </div>
      <div style={{ padding: '20px 22px' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: '#333', minWidth: 16, userSelect: 'none', fontSize: 11 }}>{i + 1}</span>
            <span
              style={{
                color:
                  line.type === 'h1' ? '#7dd3fc'
                  : line.type === 'h2' ? '#93c5fd'
                  : line.type === 'item' ? '#d4d4d4'
                  : '#6b7280',
                fontWeight: line.type.startsWith('h') ? 600 : 400,
              }}
            >
              {line.content || '\u00a0'}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: '#333', minWidth: 16, fontSize: 11 }}>{lines.length + 1}</span>
          <span style={{ borderRight: '2px solid #d4785c', display: 'inline-block', marginLeft: 1, animation: 'blink 1s step-end infinite' }}>&nbsp;</span>
        </div>
      </div>
    </div>
  );
}

function AnimatedStatsMockup() {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const end = 42;
    let start = 0;
    const duration = 1800;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{
        background: '#0C0C0C',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${C.borderDark}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: '32px',
      }}
    >
      <div style={{ fontFamily: sans, fontSize: 11, color: C.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 28 }}>
        Partnership Impact
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[
          { prefix: '$', val: count, suffix: 'M', label: 'Combined Revenue' },
          { prefix: '', val: Math.floor((count / 42) * 12), suffix: '', label: 'New Markets' },
          { prefix: '', val: Math.floor((count / 42) * 3), suffix: 'x', label: 'Average ROI' },
          { prefix: '', val: Math.floor((count / 42) * 98), suffix: '%', label: 'Partner Satisfaction' },
        ].map(({ prefix, val, suffix, label }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: serif,
                fontSize: 32,
                fontWeight: 700,
                color: C.accent,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {prefix}{val}{suffix}
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: C.textMuted }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemesMockup() {
  const [active, setActive] = useState(0);
  const themes = [
    { name: 'Dark Minimal', bg: '#0C0C0C', text: '#F0EDE8', accent: '#D4785C' },
    { name: 'Light Corporate', bg: '#FAFAF7', text: '#1A1A1A', accent: '#2563EB' },
    { name: 'Bold Brand', bg: '#1a0a2e', text: '#f0e6ff', accent: '#a855f7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {themes.map((t, i) => (
        <button
          key={t.name}
          onClick={() => setActive(i)}
          style={{
            background: t.bg,
            border: `2px solid ${active === i ? C.accent : C.borderDark}`,
            borderRadius: 8,
            padding: '14px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            transition: 'all 0.25s',
            transform: active === i ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: serif, fontSize: 13, color: t.text, fontWeight: 700, textAlign: 'left' }}>
              {t.name}
            </div>
            <div style={{ fontFamily: sans, fontSize: 11, color: `${t.text}88`, textAlign: 'left', marginTop: 2 }}>
              Colors · Fonts · Transitions
            </div>
          </div>
          {active === i && (
            <div style={{ marginLeft: 'auto', color: C.accent, fontSize: 16 }}>✓</div>
          )}
        </button>
      ))}
    </div>
  );
}

function TeamMockup() {
  const proposals = [
    { title: 'Acme Corp Partnership', status: 'Published', views: 24, initials: 'AC', color: '#7C3AED' },
    { title: 'NovaTech Q1 Pitch', status: 'Draft', views: 0, initials: 'NT', color: '#0891B2' },
    { title: 'Meridian Distribution', status: 'Published', views: 57, initials: 'MD', color: '#059669' },
  ];

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '14px 18px' }}>
        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: C.textPrimary }}>My Proposals</div>
      </div>
      {proposals.map((p) => (
        <div
          key={p.title}
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: p.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 600,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {p.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: sans, fontSize: 13, color: C.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {p.title}
            </div>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
              {p.views > 0 ? `${p.views} views` : 'Not shared yet'}
            </div>
          </div>
          <div
            style={{
              fontFamily: sans,
              fontSize: 10,
              fontWeight: 500,
              color: p.status === 'Published' ? '#059669' : C.textSecondary,
              background: p.status === 'Published' ? '#f0fdf4' : C.bgSecondary,
              padding: '3px 8px',
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {p.status}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Live update mockup ───────────────────────────────────────────────────────
function LiveUpdateMockup() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });
  const [phase, setPhase] = useState<'idle' | 'editing' | 'updated'>('idle');
  const [displayVal, setDisplayVal] = useState('200+');

  useEffect(() => {
    if (!inView) { setPhase('idle'); setDisplayVal('200+'); return; }
    const t1 = setTimeout(() => setPhase('editing'), 800);
    const t2 = setTimeout(() => { setDisplayVal('300+'); setPhase('updated'); }, 2000);
    const t3 = setTimeout(() => { setPhase('idle'); setDisplayVal('200+'); }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView]);

  const isEditing = phase === 'editing';
  const isUpdated = phase === 'updated';

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        border: `1px solid ${C.borderDark}`,
      }}
    >
      {/* Left: Editor panel */}
      <div style={{ background: '#1a1a1a', padding: '20px 18px' }}>
        {/* Editor chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontFamily: sans, fontSize: 10, color: '#555', marginLeft: 6 }}>
            Slide Editor
          </span>
        </div>

        {/* Slide type label */}
        <div style={{ fontFamily: sans, fontSize: 10, color: '#444', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Stats slide
        </div>

        {/* Stat field being edited */}
        <div
          style={{
            background: '#111',
            borderRadius: 7,
            padding: '10px 12px',
            border: `1px solid ${isEditing ? C.accent : '#2a2a2a'}`,
            transition: 'border-color 0.3s',
            marginBottom: 8,
          }}
        >
          <div style={{ fontFamily: sans, fontSize: 9, color: '#555', marginBottom: 4, letterSpacing: '0.04em' }}>
            STAT VALUE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: serif,
                fontSize: 20,
                fontWeight: 700,
                color: isEditing ? C.accent : C.textOnDark,
                transition: 'color 0.3s',
              }}
            >
              {isEditing ? '300+' : displayVal}
            </span>
            {isEditing && (
              <span
                style={{
                  display: 'inline-block',
                  width: 1.5,
                  height: 18,
                  background: C.accent,
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* Other fields (decorative) */}
        {[['LABEL', 'Partners Reached'], ['SUFFIX', 'across 14 markets']].map(([lbl, val]) => (
          <div
            key={lbl}
            style={{
              background: '#111',
              borderRadius: 7,
              padding: '8px 12px',
              border: '1px solid #222',
              marginBottom: 8,
              opacity: 0.5,
            }}
          >
            <div style={{ fontFamily: sans, fontSize: 9, color: '#555', marginBottom: 3, letterSpacing: '0.04em' }}>{lbl}</div>
            <div style={{ fontFamily: sans, fontSize: 12, color: '#888' }}>{val}</div>
          </div>
        ))}

        {/* Save indicator */}
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: isUpdated ? 1 : 0,
            transition: 'opacity 0.4s',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontFamily: sans, fontSize: 10, color: '#4ade80' }}>Autosaved</span>
        </div>
      </div>

      {/* Right: Live proposal view */}
      <div style={{ background: '#0C0C0C', padding: '20px 18px' }}>
        {/* Browser URL bar */}
        <div
          style={{
            background: '#161616',
            borderRadius: 5,
            padding: '5px 10px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid #2a2a2a',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#28c840', flexShrink: 0 }} />
          <span style={{ fontFamily: sans, fontSize: 10, color: '#555', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            handshake.so/p/acme-2026
          </span>
        </div>

        {/* Proposal content */}
        <div style={{ fontFamily: sans, fontSize: 9, color: '#444', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Live · always current
        </div>

        <div
          style={{
            fontFamily: serif,
            fontSize: 13,
            fontWeight: 700,
            color: C.textOnDark,
            marginBottom: 14,
            lineHeight: 1.3,
          }}
        >
          Partnership Impact
        </div>

        {/* Animated stat card */}
        <div
          style={{
            background: `${C.accent}12`,
            border: `1px solid ${isUpdated ? C.accent : `${C.accent}30`}`,
            borderRadius: 8,
            padding: '12px 14px',
            transition: 'border-color 0.5s',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontFamily: serif,
              fontSize: 28,
              fontWeight: 700,
              color: C.accent,
              lineHeight: 1,
              marginBottom: 4,
              transition: 'all 0.4s',
              transform: isUpdated ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {displayVal}
          </div>
          <div style={{ fontFamily: sans, fontSize: 10, color: C.textMuted }}>Partners Reached</div>
          {isUpdated && (
            <div
              style={{
                marginTop: 6,
                fontFamily: sans,
                fontSize: 9,
                color: '#4ade80',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4ade80' }} />
              Just updated
            </div>
          )}
        </div>

        {/* Other stats (decorative) */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['12', 'Markets'], ['3x', 'ROI']].map(([val, lbl]) => (
            <div
              key={lbl}
              style={{
                flex: 1,
                background: '#161616',
                borderRadius: 6,
                padding: '8px 10px',
                border: '1px solid #222',
              }}
            >
              <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.textOnDark }}>{val}</div>
              <div style={{ fontFamily: sans, fontSize: 9, color: C.textMuted }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature highlights ───────────────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      bg: C.bgPrimary,
      textColor: C.textPrimary,
      bodyColor: C.textSecondary,
      label: 'Markdown Ingestor',
      title: 'Paste your content.\nGet a slide deck.',
      body: 'Write in markdown — or paste from any doc — and Handshake converts it into a fully structured proposal with the right slides, in seconds.',
      visual: <MarkdownMockup />,
      reverse: false,
    },
    {
      bg: C.bgDark,
      textColor: C.textOnDark,
      bodyColor: C.textMuted,
      label: 'Animated Presentations',
      title: 'Proposals that feel\nlike products.',
      body: 'Full-screen slides with smooth transitions, animated counters, staggered reveals, and a cinematic scroll experience your partners won\'t forget.',
      visual: <AnimatedStatsMockup />,
      reverse: true,
    },
    {
      bg: C.bgSecondary,
      textColor: C.textPrimary,
      bodyColor: C.textSecondary,
      label: 'Always Live',
      title: 'Send once.\nUpdate forever.',
      body: 'Your proposal isn\'t a file — it\'s a live page. Fix a typo, update pricing, swap a case study, add a new slide — your partner\'s link stays the same and always shows the latest version.\n\nNo resending. No version confusion. No "please see the updated attachment."',
      visual: <LiveUpdateMockup />,
      reverse: false,
    },
    {
      bg: C.bgDark,
      textColor: C.textOnDark,
      bodyColor: C.textMuted,
      label: 'Themes & Brand',
      title: 'Your brand.\nNot a template.',
      body: 'Choose from a curated set of themes — dark, light, bold — each designed for presentations that feel intentional. Override accent colors to match your brand in seconds.',
      visual: <ThemesMockup />,
      reverse: true,
    },
    {
      bg: C.bgPrimary,
      textColor: C.textPrimary,
      bodyColor: C.textSecondary,
      label: 'Proposal Dashboard',
      title: 'Everything in\none place.',
      body: 'Manage all your proposals from a single workspace. See which decks are live, track views, and jump straight back into editing — no hunting through folders or email threads.',
      visual: <TeamMockup />,
      reverse: false,
    },
  ];

  return (
    <div id="features">
        {features.map(({ bg, textColor, bodyColor, label, title, body, visual, reverse }) => {
        const { ref, inView } = useReveal();

        return (
          <section key={label} style={{ background: bg, padding: '100px 32px' }}>
            <div
              ref={ref}
              style={{
                maxWidth: 1100,
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 80,
                alignItems: 'center',
                direction: reverse ? 'rtl' : 'ltr',
              }}
              className="landing-feature-grid"
            >
              <div style={{ direction: 'ltr' }}>
                <motion.div
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                  custom={0}
                  variants={fadeUp}
                  style={{
                    fontFamily: sans,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: C.accent,
                    marginBottom: 18,
                  }}
                >
                  {label}
                </motion.div>
                <motion.h3
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                  custom={0.08}
                  variants={fadeUp}
                  style={{
                    fontFamily: serif,
                    fontSize: 'clamp(28px, 3vw, 40px)',
                    fontWeight: 700,
                    color: textColor,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    marginBottom: 20,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {title}
                </motion.h3>
                <motion.p
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                  custom={0.16}
                  variants={fadeUp}
                  style={{
                    fontFamily: sans,
                    fontSize: 16,
                    fontWeight: 300,
                    color: bodyColor,
                    lineHeight: 1.7,
                    maxWidth: 420,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {body}
                </motion.p>
              </div>

              <motion.div
                style={{ direction: 'ltr' }}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.12 }}
              >
                {visual}
              </motion.div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// ─── Live example CTA ─────────────────────────────────────────────────────────
function LiveExampleCTA() {
  const { ref, inView } = useReveal();

  return (
    <section
      id="live-example"
      style={{
        background: C.bgDark,
        padding: '120px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.accent}10 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      <div ref={ref} style={{ maxWidth: 640, margin: '0 auto', position: 'relative' }}>
        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={fadeUp}
          style={{
            fontFamily: serif,
            fontSize: 'clamp(32px, 4vw, 50px)',
            fontWeight: 700,
            color: C.textOnDark,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}
        >
          See it in action.
        </motion.h2>
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.1}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 18,
            fontWeight: 300,
            color: C.textMuted,
            lineHeight: 1.65,
            marginBottom: 40,
          }}
        >
          Experience a real Handshake proposal — the same animated, themed, slide-deck pages
          your team will create.
        </motion.p>
        <motion.a
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.2}
          variants={fadeUp}
          href="/p/demo"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: sans,
            fontSize: 15,
            fontWeight: 500,
            color: C.textPrimary,
            background: C.textOnDark,
            border: 'none',
            cursor: 'pointer',
            padding: '14px 32px',
            borderRadius: 9,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          whileHover={{ scale: 1.02, backgroundColor: '#fff' }}
        >
          View a Live Proposal
          <span style={{ fontSize: 18 }}>→</span>
        </motion.a>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingSection() {
  const { ref, inView } = useReveal();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['3 proposals', '1 theme', 'Basic analytics', 'Public share links'],
      cta: 'Start Free',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/mo',
      features: ['Unlimited proposals', 'All themes', 'Full analytics', 'AI copy assistant', 'Custom domain'],
      cta: 'Get Early Access',
      featured: true,
    },
    {
      name: 'Team',
      price: '$39',
      period: '/mo per user',
      features: ['Everything in Pro', 'Shared workspace', 'Team comments', 'Asset library', 'Priority support'],
      cta: 'Get Early Access',
      featured: false,
    },
  ];

  return (
    <section id="pricing" style={{ background: C.bgPrimary, padding: '120px 32px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div ref={ref}>
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0}
            variants={fadeUp}
            style={{
              fontFamily: sans,
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: C.accent,
              marginBottom: 16,
            }}
          >
            Pricing
          </motion.div>
          <motion.h2
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.08}
            variants={fadeUp}
            style={{
              fontFamily: serif,
              fontSize: 'clamp(30px, 3.5vw, 46px)',
              fontWeight: 700,
              color: C.textPrimary,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              marginBottom: 60,
            }}
          >
            Simple, transparent pricing.
          </motion.h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
          className="landing-pricing-grid"
        >
          {plans.map(({ name, price, period, features, cta, featured }, i) => {
            const { ref: cardRef, inView: cardInView } = useReveal();
            return (
              <motion.div
                key={name}
                ref={cardRef}
                initial="hidden"
                animate={cardInView ? 'visible' : 'hidden'}
                custom={i * 0.1}
                variants={fadeUp}
                style={{
                  background: featured ? C.bgDark : '#fff',
                  border: featured ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: '36px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'transform 0.2s',
                }}
                whileHover={{ scale: 1.02 }}
              >
                {featured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.accent,
                      color: '#fff',
                      fontFamily: sans,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '4px 14px',
                      borderRadius: 20,
                    }}
                  >
                    Most Popular
                  </div>
                )}

                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 500,
                    color: featured ? C.textMuted : C.textSecondary,
                    letterSpacing: '0.04em',
                    marginBottom: 16,
                  }}
                >
                  {name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                  <span
                    style={{
                      fontFamily: serif,
                      fontSize: 40,
                      fontWeight: 700,
                      color: featured ? C.textOnDark : C.textPrimary,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {price}
                  </span>
                  <span
                    style={{
                      fontFamily: sans,
                      fontSize: 13,
                      color: featured ? C.textMuted : C.textSecondary,
                    }}
                  >
                    {period}
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    flex: 1,
                  }}
                >
                  {features.map((f) => (
                    <li
                      key={f}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: sans,
                        fontSize: 14,
                        color: featured ? `${C.textOnDark}cc` : C.textSecondary,
                        fontWeight: 300,
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: featured ? `${C.accent}25` : `${C.accent}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: 10,
                          color: C.accent,
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    fontFamily: sans,
                    fontSize: 14,
                    fontWeight: 500,
                    color: featured ? '#fff' : C.textPrimary,
                    background: featured ? C.accent : 'transparent',
                    border: featured ? 'none' : `1px solid ${C.border}`,
                    cursor: 'pointer',
                    padding: '11px 20px',
                    borderRadius: 8,
                    width: '100%',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (featured) (e.currentTarget as HTMLElement).style.background = C.accentHover;
                    else (e.currentTarget as HTMLElement).style.borderColor = '#c8c5be';
                  }}
                  onMouseLeave={(e) => {
                    if (featured) (e.currentTarget as HTMLElement).style.background = C.accent;
                    else (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  }}
                >
                  {cta}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Email capture / Waitlist ─────────────────────────────────────────────────
function WaitlistSection() {
  const { ref, inView } = useReveal();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
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
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <section
      id="waitlist"
      style={{
        background: C.bgDark,
        padding: '140px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orb */}
      <div
        style={{
          position: 'absolute',
          bottom: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${C.accent}12 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      <div ref={ref} style={{ maxWidth: 580, margin: '0 auto', position: 'relative' }}>
        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: C.accent,
            marginBottom: 20,
          }}
        >
          Join the waitlist
        </motion.p>

        <motion.h2
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.08}
          variants={fadeUp}
          style={{
            fontFamily: serif,
            fontSize: 'clamp(32px, 4.5vw, 52px)',
            fontWeight: 700,
            color: C.textOnDark,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: 18,
          }}
        >
          Ready to stop sending PDFs?
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.16}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 17,
            fontWeight: 300,
            color: C.textMuted,
            lineHeight: 1.65,
            marginBottom: 44,
          }}
        >
          Join the waitlist and be the first to create proposals your partners actually remember.
        </motion.p>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.24}
          variants={fadeUp}
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: `${C.accent}15`,
                  border: `1px solid ${C.accent}40`,
                  borderRadius: 12,
                  padding: '24px 32px',
                  fontFamily: sans,
                  fontSize: 16,
                  color: C.textOnDark,
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                <strong style={{ display: 'block', marginBottom: 6 }}>You're on the list.</strong>
                <span style={{ color: C.textMuted, fontSize: 14 }}>We'll be in touch soon.</span>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  gap: 10,
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', gap: 10 }} className="landing-form-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
                    placeholder="your@workemail.com"
                    required
                    style={{
                      flex: 1,
                      fontFamily: sans,
                      fontSize: 15,
                      color: C.textOnDark,
                      background: '#161616',
                      border: `1px solid ${status === 'error' ? '#f87171' : C.borderDark}`,
                      borderRadius: 9,
                      padding: '13px 18px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      minWidth: 0,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = C.accent)}
                    onBlur={(e) => (e.target.style.borderColor = status === 'error' ? '#f87171' : C.borderDark)}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    style={{
                      fontFamily: sans,
                      fontSize: 15,
                      fontWeight: 500,
                      color: '#fff',
                      background: status === 'loading' ? C.accentHover : C.accent,
                      border: 'none',
                      cursor: status === 'loading' ? 'wait' : 'pointer',
                      padding: '13px 24px',
                      borderRadius: 9,
                      whiteSpace: 'nowrap',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.background = C.accentHover; }}
                    onMouseLeave={(e) => { if (status !== 'loading') (e.currentTarget as HTMLElement).style.background = C.accent; }}
                  >
                    {status === 'loading' ? 'Joining…' : 'Get Early Access'}
                  </button>
                </div>
                {status === 'error' && (
                  <p style={{ fontFamily: sans, fontSize: 13, color: '#f87171', textAlign: 'left' }}>{errorMsg}</p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          custom={0.32}
          variants={fadeUp}
          style={{
            fontFamily: sans,
            fontSize: 13,
            color: `${C.textMuted}99`,
            marginTop: 20,
          }}
        >
          No credit card required. Free plan available at launch.
        </motion.p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: C.bgDark,
        borderTop: `1px solid ${C.borderDark}`,
        padding: '32px',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div
          style={{
            fontFamily: serif,
            fontSize: 16,
            fontWeight: 700,
            color: C.textOnDark,
            letterSpacing: '-0.01em',
          }}
        >
          Handshake
        </div>

        <div
          style={{
            fontFamily: sans,
            fontSize: 12,
            color: C.textMuted,
            textAlign: 'center',
          }}
        >
          © 2026 Handshake. All rights reserved.
        </div>

        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Twitter', href: '#' },
            { label: 'LinkedIn', href: '#' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: C.textMuted,
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.textOnDark)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.textMuted)}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── Landing page CSS ─────────────────────────────────────────────────────────
const landingStyles = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .landing-hero-grid {
    grid-template-columns: 1fr 1fr;
  }

  .landing-steps-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .landing-feature-grid {
    grid-template-columns: 1fr 1fr;
  }

  .landing-pricing-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .landing-form-row {
    flex-direction: row;
  }

  .landing-desktop-nav {
    display: flex !important;
  }

  .landing-hamburger {
    display: none !important;
  }

  @media (max-width: 768px) {
    .landing-hero-grid {
      grid-template-columns: 1fr !important;
    }
    .landing-hero-visual {
      display: none !important;
    }
    .landing-steps-grid {
      grid-template-columns: 1fr !important;
    }
    .landing-feature-grid {
      grid-template-columns: 1fr !important;
      direction: ltr !important;
    }
    .landing-pricing-grid {
      grid-template-columns: 1fr !important;
    }
    .landing-form-row {
      flex-direction: column !important;
    }
    .landing-desktop-nav {
      display: none !important;
    }
    .landing-hamburger {
      display: flex !important;
    }
  }

  @media (max-width: 1024px) {
    .landing-steps-grid {
      grid-template-columns: 1fr !important;
    }
    .landing-pricing-grid {
      grid-template-columns: 1fr 1fr !important;
    }
    .landing-feature-grid {
      gap: 48px !important;
    }
  }
`;

// ─── Root component ───────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <>
      <style>{landingStyles}</style>
      <div style={{ fontFamily: sans, overflowX: 'hidden' }}>
        <NavBar />
        <HeroSection />
        <SocialProofBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <LiveExampleCTA />
        <PricingSection />
        <WaitlistSection />
        <Footer />
      </div>
    </>
  );
}
