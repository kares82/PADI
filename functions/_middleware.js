/* Cache-Control, set where Pages cannot argue with it.
   ------------------------------------------------------------------
   Pages serves its static assets with `public, max-age=14400` - four
   hours - and a _headers file does not override that. The evidence:
   on a fresh edge miss, /audio/index.json came back with the rule
   applied twice, because Pages' own value for a .json happens to be
   the same as ours and the two were appended. For .js and .css, where
   the values disagree, ours was simply dropped and Pages' four hours
   stood.

   Four hours is how two verified deploys reached the server and never
   reached the browser. So the header is set here instead, after the
   asset has been served but before it leaves, where nothing overrides
   it.

   The service worker also asks for the wire explicitly, and that alone
   would heal this within two page loads. This makes it true on the
   first one, and true for anyone whose service worker never starts. */

const HOUR = 3600;

export async function onRequest(context) {
  const res  = await context.next();
  const path = new URL(context.request.url).pathname;

  // Recordings are the only heavy thing here and change only when the
  // whole set is re-recorded. Everything else decides how the app
  // behaves, so it revalidates every time; a 304 is a few hundred bytes.
  const cache = /\.mp3$/i.test(path)
    ? `public, max-age=${HOUR}`
    : 'public, max-age=0, must-revalidate';

  const headers = new Headers(res.headers);
  headers.set('Cache-Control', cache);

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: headers
  });
}
