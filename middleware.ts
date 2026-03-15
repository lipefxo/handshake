import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Vercel Edge Middleware that intercepts /p/:slug requests from social crawlers
 * and proxies them to the /api/og serverless function for proper OG meta tags.
 *
 * Regular browsers get the normal SPA.
 */

const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'Discordbot',
  'TelegramBot',
  'Googlebot',
  'bingbot',
  'Applebot',
  'ia_archiver',
];

export const config = {
  matcher: ['/p/:slug*', '/s/:code*'],
};

export default async function middleware(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));

  if (!isBot) {
    return NextResponse.next();
  }

  // Extract slug from URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length < 2) {
    return NextResponse.next();
  }

  const slugOrCode = pathParts[1];
  const isShortCode = pathParts[0] === 's';

  try {
    // Fetch proposal metadata from Supabase edge function
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next();
    }

    const metaResponse = await fetch(`${supabaseUrl}/functions/v1/proposal-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(
        isShortCode ? { shortCode: slugOrCode } : { slug: slugOrCode },
      ),
    });

    if (!metaResponse.ok) {
      return NextResponse.next();
    }

    const metaData = await metaResponse.json();
    const proposal = metaData?.proposal;

    if (!proposal) {
      return NextResponse.next();
    }

    // Rewrite to OG handler with proposal data as query params
    const ogUrl = new URL('/api/og', req.url);
    ogUrl.searchParams.set('slug', proposal.slug);
    ogUrl.searchParams.set('title', proposal.title);
    ogUrl.searchParams.set('partner', proposal.partnerName);
    ogUrl.searchParams.set('themeId', proposal.themeId);

    return NextResponse.rewrite(ogUrl);
  } catch {
    return NextResponse.next();
  }
}
