/**
 * reset-redirect: Supabase Edge Function
 *
 * Acts as a browser-side redirect proxy for password recovery.
 * The recovery email links to this function URL instead of directly to mapadevendas.app.
 * Since this function runs on supabase.co (not mapadevendas.app), the Capacitor app
 * does NOT intercept it via App Links / Universal Links.
 *
 * Flow:
 * 1. User receives recovery email with link to this function
 * 2. User clicks link → opens in BROWSER (not app, since domain is supabase.co)
 * 3. This function redirects to mapadevendas.app/reset-password with all params preserved
 * 4. Browser opens mapadevendas.app/reset-password (but App Links may still intercept...)
 *
 * Actually: Step 3 redirects to the WEB version of the app at the browser level.
 * Since the redirect happens inside the browser, the browser follows it.
 * On iOS, Universal Links only intercept links clicked by the USER (cold navigation).
 * A server-side 302 redirect in the same browser session is NOT intercepted by Universal Links.
 * On Android, App Links similarly don't intercept server-side redirects in the same browser session.
 *
 * This means: click in email → opens browser → 302 to mapadevendas.app/reset-password?code=xxx
 * → browser handles it (NOT the app) → ResetPassword.tsx in browser runs exchangeCodeForSession
 * → works correctly!
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const WEB_RESET_URL = "https://mapadevendas.app/reset-password";

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const params = url.searchParams;

  // Forward all query params to the web app's reset-password page
  const targetUrl = new URL(WEB_RESET_URL);
  params.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: targetUrl.toString(),
      "Cache-Control": "no-store",
    },
  });
});
