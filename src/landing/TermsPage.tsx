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

export function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, marginBottom: 48 }}>
          Last updated: February 22, 2026
        </p>

        <div style={{ borderTop: `1px solid ${C.borderDark}`, paddingTop: 32 }}>
          <h2 style={sectionHeadingStyle}>1. Acceptance of Terms</h2>
          <p style={paragraphStyle}>
            By accessing or using Handshake ("the Service"), operated at handshake.design, you agree
            to be bound by these Terms of Service ("Terms"). If you do not agree to all of these
            Terms, you may not access or use the Service. We reserve the right to update these Terms
            at any time, and your continued use of the Service after any changes constitutes
            acceptance of the updated Terms.
          </p>

          <h2 style={sectionHeadingStyle}>2. Description of Service</h2>
          <p style={paragraphStyle}>
            Handshake is a proposal creation platform that allows users to build animated,
            slide-deck-style partnership proposals, share them via unique public URLs, and manage
            them through an admin dashboard. The Service is provided on an "as-is" and
            "as-available" basis.
          </p>

          <h2 style={sectionHeadingStyle}>3. Account Registration</h2>
          <p style={paragraphStyle}>
            To use certain features of the Service, you must create an account using a valid email
            address via our magic link authentication system. You are responsible for:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              Maintaining the security of your account credentials and email access
            </li>
            <li style={{ marginBottom: 8 }}>
              All activities that occur under your account
            </li>
            <li style={{ marginBottom: 8 }}>
              Notifying us immediately of any unauthorized use of your account
            </li>
          </ul>
          <p style={paragraphStyle}>
            You must be at least 18 years of age to create an account and use the Service.
          </p>

          <h2 style={sectionHeadingStyle}>4. User Content</h2>
          <p style={paragraphStyle}>
            "User Content" refers to any text, images, media, or other materials you upload, create,
            or share through the Service, including proposal content, slides, and uploaded images.
          </p>
          <p style={paragraphStyle}>
            You retain all ownership rights to your User Content. By submitting User Content to the
            Service, you grant Handshake a limited, non-exclusive, worldwide license to host, store,
            display, and distribute your User Content solely for the purpose of operating and
            providing the Service to you and your intended recipients.
          </p>
          <p style={paragraphStyle}>
            You represent and warrant that you have all necessary rights to the User Content you
            submit and that your User Content does not violate any third-party rights, including
            intellectual property or privacy rights.
          </p>

          <h2 style={sectionHeadingStyle}>5. Acceptable Use</h2>
          <p style={paragraphStyle}>
            You agree not to use the Service to:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              Upload, share, or distribute content that is unlawful, defamatory, obscene,
              fraudulent, or harmful
            </li>
            <li style={{ marginBottom: 8 }}>
              Impersonate any person or entity, or falsely represent your affiliation with any
              person or entity
            </li>
            <li style={{ marginBottom: 8 }}>
              Attempt to gain unauthorized access to the Service, other accounts, or any related
              systems or networks
            </li>
            <li style={{ marginBottom: 8 }}>
              Interfere with or disrupt the integrity or performance of the Service
            </li>
            <li style={{ marginBottom: 8 }}>
              Use the Service for any purpose that is illegal or prohibited by these Terms
            </li>
            <li style={{ marginBottom: 8 }}>
              Use automated means (bots, scrapers, crawlers) to access the Service without prior
              written consent
            </li>
            <li style={{ marginBottom: 8 }}>
              Distribute spam, phishing content, or malware through proposals or any other feature
              of the Service
            </li>
          </ul>

          <h2 style={sectionHeadingStyle}>6. Intellectual Property</h2>
          <p style={paragraphStyle}>
            The Service, including its design, features, code, branding, and documentation, is owned
            by Handshake and protected by intellectual property laws. Nothing in these Terms grants
            you any right, title, or interest in the Service beyond the limited right to use it in
            accordance with these Terms.
          </p>
          <p style={paragraphStyle}>
            The Handshake name, logo, and all related marks are trademarks of Handshake. You may
            not use these marks without prior written permission.
          </p>

          <h2 style={sectionHeadingStyle}>7. Third-Party Services</h2>
          <p style={paragraphStyle}>
            The Service may integrate with or rely on third-party services, including Supabase for
            authentication and data storage, and Vercel for hosting. Your use of these third-party
            services is subject to their own terms and privacy policies. Handshake is not
            responsible for the availability, security, or practices of any third-party services.
          </p>

          <h2 style={sectionHeadingStyle}>8. Refund Policy</h2>
          <p style={paragraphStyle}>
            If you are unsatisfied with the Service, you may request a refund within fourteen (14)
            days of your initial purchase or subscription renewal. Refund requests must be submitted
            by contacting us at{' '}
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
          <p style={paragraphStyle}>
            Refunds are subject to the following conditions:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              Refund requests must be made within 14 days of the charge date
            </li>
            <li style={{ marginBottom: 8 }}>
              Refunds apply to subscription fees only and do not cover any third-party costs or
              fees incurred through the use of the Service
            </li>
            <li style={{ marginBottom: 8 }}>
              Partial-month or partial-period refunds are not provided for mid-cycle cancellations
              outside the 14-day window
            </li>
            <li style={{ marginBottom: 8 }}>
              Upon approval, refunds will be processed to the original payment method within 5–10
              business days
            </li>
            <li style={{ marginBottom: 8 }}>
              Handshake reserves the right to deny refund requests in cases of abuse, fraud, or
              violation of these Terms
            </li>
          </ul>
          <p style={paragraphStyle}>
            If your account is terminated by Handshake for reasons other than a violation of these
            Terms, you may be entitled to a pro-rata refund for any unused portion of your
            prepaid subscription period.
          </p>

          <h2 style={sectionHeadingStyle}>9. Termination</h2>
          <p style={paragraphStyle}>
            We may suspend or terminate your access to the Service at any time, with or without
            cause, and with or without notice. You may also delete your account at any time. Upon
            termination:
          </p>
          <ul style={listStyle}>
            <li style={{ marginBottom: 8 }}>
              Your right to access and use the Service will immediately cease
            </li>
            <li style={{ marginBottom: 8 }}>
              We may delete your account data and User Content after a reasonable retention period
            </li>
            <li style={{ marginBottom: 8 }}>
              Published proposals may become inaccessible to their intended recipients
            </li>
          </ul>

          <h2 style={sectionHeadingStyle}>10. Disclaimers</h2>
          <p style={paragraphStyle}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p style={paragraphStyle}>
            Handshake does not warrant that the Service will be uninterrupted, error-free, or
            secure, or that any defects will be corrected. You use the Service at your own risk.
          </p>

          <h2 style={sectionHeadingStyle}>11. Limitation of Liability</h2>
          <p style={paragraphStyle}>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HANDSHAKE AND ITS OFFICERS,
            EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF
            PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
            SERVICE.
          </p>
          <p style={paragraphStyle}>
            In no event shall Handshake's total aggregate liability exceed the amount you have paid
            to Handshake, if any, for access to the Service during the twelve (12) months preceding
            the claim.
          </p>

          <h2 style={sectionHeadingStyle}>12. Indemnification</h2>
          <p style={paragraphStyle}>
            You agree to indemnify, defend, and hold harmless Handshake and its officers, employees,
            and agents from and against any claims, liabilities, damages, losses, and expenses,
            including reasonable legal fees, arising out of or in any way connected with your access
            to or use of the Service, your User Content, or your violation of these Terms.
          </p>

          <h2 style={sectionHeadingStyle}>13. Governing Law</h2>
          <p style={paragraphStyle}>
            These Terms shall be governed by and construed in accordance with the laws of the
            jurisdiction in which Handshake operates, without regard to its conflict of law
            provisions. Any disputes arising from these Terms or the Service shall be resolved in
            the competent courts of that jurisdiction.
          </p>

          <h2 style={sectionHeadingStyle}>14. Changes to These Terms</h2>
          <p style={paragraphStyle}>
            We reserve the right to modify these Terms at any time. When we make material changes,
            we will update the "Last updated" date at the top of this page and, where appropriate,
            notify you via email or through the Service. Your continued use of the Service after
            changes are posted constitutes your acceptance of the revised Terms.
          </p>

          <h2 style={sectionHeadingStyle}>15. Contact</h2>
          <p style={paragraphStyle}>
            If you have any questions about these Terms of Service, please contact us at{' '}
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
            © 2026 Handshake. All rights reserved. Built by Grafite Design Ltda.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link
              to="/privacy"
              style={{ fontFamily: sans, fontSize: 13, color: C.textMuted, textDecoration: 'none' }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = C.textOnDark)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = C.textMuted)}
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
