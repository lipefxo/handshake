import { Link } from 'react-router-dom';
import { BrandWordmark } from '../shared/components/BrandWordmark';

const C = {
  bgDark: '#0C0C0C',
  textOnDark: '#F0EDE8',
  textMuted: '#9A9590',
  accent: '#D4785C',
  accentHover: '#C06A50',
  borderDark: '#2A2A2A',
} as const;

const serif = "'Libre Baskerville', Georgia, serif";
const sans = "'DM Sans', system-ui, sans-serif";

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: serif,
  fontSize: 22,
  color: C.textOnDark,
  marginTop: 48,
  marginBottom: 16,
  lineHeight: 1.4,
};

const paragraphStyle: React.CSSProperties = {
  fontFamily: sans,
  fontSize: 15,
  color: C.textMuted,
  lineHeight: 1.8,
  marginBottom: 16,
};

const listStyle: React.CSSProperties = {
  ...paragraphStyle,
  paddingLeft: 24,
  marginBottom: 16,
};

export function PrivacyPage() {
  return (
    <div style={{ background: C.bgDark, minHeight: '100vh' }}>
      <nav
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px 24px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" aria-label="Back to home">
          <BrandWordmark variant="dark" style={{ height: 16, width: 'auto' }} />
        </Link>
        <Link
          to="/"
          style={{
            fontFamily: sans,
            fontSize: 13,
            color: C.textMuted,
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.accent)}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.textMuted)}
        >
          ← Back to home
        </Link>
      </nav>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>
        <h1
          style={{
            fontFamily: serif,
            fontSize: 36,
            color: C.textOnDark,
            marginBottom: 12,
            lineHeight: 1.3,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, marginBottom: 48 }}>
          Last updated: February 22, 2026
        </p>

        <div style={{ borderTop: `1px solid ${C.borderDark}`, paddingTop: 32 }}>
          <h2 style={sectionHeadingStyle}>1. Introduction</h2>
          <p style={paragraphStyle}>
            Handshake ("we", "us", or "our") operates the handshake.design website and the
            Handshake proposal platform (the "Service"). This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our Service.
          </p>
          <p style={paragraphStyle}>
            By using the Service, you consent to the data practices described in this policy. If you
            do not agree with the terms of this Privacy Policy, please do not access or use the
            Service.
          </p>

          <h2 style={sectionHeadingStyle}>2. Information We Collect</h2>

          <h3
            style={{
              fontFamily: serif,
              fontSize: 17,
              color: C.textOnDark,
              marginTop: 28,
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            2.1 Information You Provide
          </h3>
          <p style={paragraphStyle}>
            When you register for an account or use the Service, you may provide us with:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Account information:</strong> Your email
              address, used for magic link authentication and account identification
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Profile information:</strong> Your name,
              company name, or other details you choose to provide in your workspace settings
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Proposal content:</strong> Text, images,
              media, and configuration data you create and upload while building proposals
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Communications:</strong> Any messages or
              feedback you send to us directly
            </li>
          </ul>

          <h3
            style={{
              fontFamily: serif,
              fontSize: 17,
              color: C.textOnDark,
              marginTop: 28,
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            2.2 Information Collected Automatically
          </h3>
          <p style={paragraphStyle}>
            When you access the Service, we may automatically collect certain information,
            including:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Usage data:</strong> Pages visited, features
              used, time spent on the Service, and interaction patterns
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Device information:</strong> Browser type,
              operating system, screen resolution, and device identifiers
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Log data:</strong> IP addresses, access times,
              referring URLs, and error logs
            </li>
          </ul>

          <h3
            style={{
              fontFamily: serif,
              fontSize: 17,
              color: C.textOnDark,
              marginTop: 28,
              marginBottom: 12,
              lineHeight: 1.4,
            }}
          >
            2.3 Cookies and Similar Technologies
          </h3>
          <p style={paragraphStyle}>
            We use cookies and similar tracking technologies to maintain your session, remember your
            preferences, and understand how you use the Service. These include:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Essential cookies:</strong> Required for
              authentication and core functionality (e.g., session tokens managed by Supabase)
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Analytics cookies:</strong> Help us understand
              usage patterns and improve the Service
            </li>
          </ul>
          <p style={paragraphStyle}>
            You can control cookie settings through your browser preferences. Disabling essential
            cookies may prevent you from using certain features of the Service.
          </p>

          <h2 style={sectionHeadingStyle}>3. How We Use Your Information</h2>
          <p style={paragraphStyle}>We use the information we collect to:</p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              Provide, operate, and maintain the Service
            </li>
            <li style={{ marginBottom: 8 }}>
              Authenticate your identity and manage your account
            </li>
            <li style={{ marginBottom: 8 }}>
              Process and deliver your proposals to their intended recipients
            </li>
            <li style={{ marginBottom: 8 }}>
              Improve, personalize, and expand the Service
            </li>
            <li style={{ marginBottom: 8 }}>
              Communicate with you about updates, security alerts, and support
            </li>
            <li style={{ marginBottom: 8 }}>
              Monitor and analyze usage trends to enhance user experience
            </li>
            <li style={{ marginBottom: 8 }}>
              Detect, prevent, and address technical issues and abuse
            </li>
            <li style={{ marginBottom: 8 }}>
              Comply with legal obligations
            </li>
          </ul>

          <h2 style={sectionHeadingStyle}>4. How We Share Your Information</h2>
          <p style={paragraphStyle}>
            We do not sell your personal information. We may share your information in the following
            circumstances:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>With proposal recipients:</strong> When you
              publish a proposal with a public URL, the content of that proposal is accessible to
              anyone with the link
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>With service providers:</strong> We use
              third-party services to operate the platform, including Supabase (database,
              authentication, and file storage) and Vercel (hosting and deployment). These providers
              only access your data as necessary to perform their services
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>With workspace members:</strong> If you are
              part of a workspace, other members of that workspace may have access to shared
              proposals and workspace settings
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>For legal reasons:</strong> We may disclose
              information if required by law, court order, or governmental regulation, or if we
              believe disclosure is necessary to protect our rights, your safety, or the safety of
              others
            </li>
          </ul>

          <h2 style={sectionHeadingStyle}>5. Data Storage and Security</h2>
          <p style={paragraphStyle}>
            Your data is stored securely using Supabase's infrastructure, which provides
            PostgreSQL-based database services with row-level security policies. Uploaded images and
            media are stored in Supabase Storage buckets with access controls.
          </p>
          <p style={paragraphStyle}>
            We implement reasonable technical and organizational measures to protect your
            information, including encryption in transit (HTTPS/TLS), authentication safeguards, and
            access controls. However, no method of transmission over the Internet or electronic
            storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 style={sectionHeadingStyle}>6. Data Retention</h2>
          <p style={paragraphStyle}>
            We retain your personal information for as long as your account is active or as needed
            to provide you with the Service. If you delete your account, we will delete or anonymize
            your personal information within a reasonable timeframe, except where retention is
            required by law or for legitimate business purposes (such as resolving disputes or
            enforcing our agreements).
          </p>
          <p style={paragraphStyle}>
            Published proposals may be retained for a limited period after account deletion to
            ensure recipients can still access them during a transition period.
          </p>

          <h2 style={sectionHeadingStyle}>7. Your Rights</h2>
          <p style={paragraphStyle}>
            Depending on your location and applicable laws, you may have the following rights
            regarding your personal data:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Access:</strong> Request a copy of the
              personal data we hold about you
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Correction:</strong> Request correction of
              inaccurate or incomplete personal data
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Deletion:</strong> Request deletion of your
              personal data, subject to certain exceptions
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Portability:</strong> Request your data in a
              structured, commonly used, and machine-readable format
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Objection:</strong> Object to the processing
              of your personal data for certain purposes
            </li>
            <li style={{ marginBottom: 8 }}>
              <strong style={{ color: C.textOnDark }}>Withdraw consent:</strong> Where processing
              is based on consent, you may withdraw it at any time
            </li>
          </ul>
          <p style={paragraphStyle}>
            To exercise any of these rights, please contact us at{' '}
            <a
              href="mailto:hello@handshake.design"
              style={{ color: C.accent, textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.accentHover)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.accent)}
            >
              hello@handshake.design
            </a>
            . We will respond to your request within 30 days.
          </p>

          <h2 style={sectionHeadingStyle}>8. International Data Transfers</h2>
          <p style={paragraphStyle}>
            Your information may be transferred to and processed in countries other than your own.
            Our service providers, including Supabase and Vercel, may process data in various
            locations globally. We ensure appropriate safeguards are in place for any international
            transfers of personal data, in compliance with applicable data protection laws.
          </p>

          <h2 style={sectionHeadingStyle}>9. Children's Privacy</h2>
          <p style={paragraphStyle}>
            The Service is not intended for individuals under the age of 18. We do not knowingly
            collect personal information from children. If we become aware that a child under 18 has
            provided us with personal information, we will take steps to delete such information. If
            you are a parent or guardian and believe your child has provided us with personal data,
            please contact us.
          </p>

          <h2 style={sectionHeadingStyle}>10. Changes to This Privacy Policy</h2>
          <p style={paragraphStyle}>
            We may update this Privacy Policy from time to time. When we make material changes, we
            will update the "Last updated" date at the top of this page. We encourage you to review
            this Privacy Policy periodically to stay informed about how we are protecting your
            information.
          </p>

          <h2 style={sectionHeadingStyle}>11. Contact Us</h2>
          <p style={paragraphStyle}>
            If you have questions or concerns about this Privacy Policy or our data practices,
            please contact us at{' '}
            <a
              href="mailto:hello@handshake.design"
              style={{ color: C.accent, textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.accentHover)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.accent)}
            >
              hello@handshake.design
            </a>
            .
          </p>
        </div>
      </main>

      <footer
        style={{
          borderTop: `1px solid ${C.borderDark}`,
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ fontFamily: sans, fontSize: 12, color: C.textMuted }}>
            © 2026 Handshake. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link
              to="/terms"
              style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.textOnDark)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.textMuted)}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
