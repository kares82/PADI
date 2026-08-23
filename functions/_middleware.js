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

   ⚠ This is correct but not yet in effect. Proved by shipping a marker
   header alongside it: the marker came back and the Cache-Control did
   not, so the function runs and the zone rewrites the header afterwards.
   That is Browser Cache TTL on the red-triangle.net zone, set to four
   hours, which overrides whatever the origin says. Fix it in the
   Cloudflare dashboard:

     the zone (not the Pages project) → Caching → Configuration
       → Browser Cache TTL → "Respect Existing Headers"

   Until then the app still gets new builds, by a different route:
   index.html is max-age=0, the worker script is registered with
   updateViaCache:'none' so the browser always fetches it fresh, and the
   new worker then asks for every asset with cache:'reload'. That heals a
   stale browser within one automatic reload. This file removes the
   reliance on that chain and is what makes it right on the first load. */

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
