import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless function that returns an HTML page with per-proposal OG meta tags.
 * Called by the middleware when a social crawler hits /p/:slug.
 *
 * Query params: slug, title, partner, themeId
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string) || '';
  const title = (req.query.title as string) || 'Proposal';
  const partner = (req.query.partner as string) || '';
  const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://www.handshake.design';

  const proposalUrl = `${siteUrl}/p/${slug}`;
  const ogTitle = partner ? `${title} — ${partner}` : title;
  const ogDescription = partner
    ? `A partnership proposal for ${partner}. View the interactive presentation.`
    : 'View this interactive proposal on Handshake.';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(ogTitle)} | Handshake</title>
  <meta name="description" content="${escapeHtml(ogDescription)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(proposalUrl)}" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:site_name" content="Handshake" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(proposalUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(proposalUrl)}">${escapeHtml(ogTitle)}</a>...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
