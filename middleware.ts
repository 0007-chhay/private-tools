/**
 * Vercel Routing Middleware: password-protects the whole site (pages + /api).
 * Works on the free Hobby plan. Runs before every request on Vercel.
 *
 * Set ONE of these in Vercel → Settings → Environment Variables, then redeploy:
 *
 *   Single user:
 *     SITE_USERNAME = krisna
 *     SITE_PASSWORD = a-long-password
 *
 *   Several users (comma separated, username:password):
 *     SITE_USERS = krisna:first-password,yoga:second-password
 *
 * If nothing is set, the site stays LOCKED and shows a setup message
 * (fail closed), so a missing variable never leaves it open by accident.
 */

export const config = {
  // Run on every path
  matcher: '/:path*',
};

const REALM = 'Private Tools';

function parseUsers(): Map<string, string> {
  const users = new Map<string, string>();
  const list = process.env.SITE_USERS || '';
  for (const entry of list.split(',')) {
    const i = entry.indexOf(':');
    if (i <= 0) continue;
    const name = entry.slice(0, i).trim();
    const pass = entry.slice(i + 1).trim();
    if (name && pass) users.set(name, pass);
  }
  const singleName = (process.env.SITE_USERNAME || '').trim();
  const singlePass = (process.env.SITE_PASSWORD || '').trim();
  if (singleName && singlePass) users.set(singleName, singlePass);
  return users;
}

async function sha256(text: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}

// Compare hashes in constant time so response timing does not leak the password
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

function decodeBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const i = decoded.indexOf(':');
    if (i < 0) return null;
    return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
  } catch {
    return null;
  }
}

// Same as `next()` from @vercel/functions: tells Vercel to continue the request
function next(): Response {
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}

function unauthorized(): Response {
  return new Response('Login required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  const users = parseUsers();

  if (users.size === 0) {
    return new Response(
      'This site is locked. Set SITE_USERNAME and SITE_PASSWORD (or SITE_USERS) in Vercel → Settings → Environment Variables, then redeploy.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } }
    );
  }

  const creds = decodeBasicAuth(request.headers.get('authorization'));
  if (!creds) return unauthorized();

  // Check every user (no early exit) so timing does not reveal valid usernames
  let ok = false;
  for (const [name, pass] of users) {
    const nameOk = await safeEqual(creds.user, name);
    const passOk = await safeEqual(creds.pass, pass);
    if (nameOk && passOk) ok = true;
  }

  return ok ? next() : unauthorized();
}
