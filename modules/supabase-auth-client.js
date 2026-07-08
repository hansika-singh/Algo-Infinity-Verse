import { createClient } from "supabase-js";

let configPromise = null;
let client = null;
let initError = null;

function fetchConfig() {
  if (!configPromise) {
    configPromise = fetch("/api/supabase-config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.configured) throw new Error("Supabase not configured");
        return data;
      })
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
}

async function ensureClient() {
  if (client) return client;
  if (initError) throw initError;

  try {
    const config = await fetchConfig();
    client = createClient(config.url, config.anonKey, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
      },
    });
    return client;
  } catch (error) {
    initError = error;
    throw error;
  }
}

// Begin the Google OAuth flow. The browser is redirected to Google; on
// approval Supabase redirects back to `returnTo` with a short-lived code that
// supabase-js exchanges for a session automatically (handled in getSessionToken).
export async function signInWithGoogle(returnTo) {
  const supabase = await ensureClient();
  const redirectTo = returnTo
    ? new URL(returnTo, window.location.origin).toString()
    : window.location.href;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error) throw error;
}

// Read the current Supabase session (performing the PKCE code exchange if we
// just returned from the provider). Returns { accessToken, user } or null.
export async function getSessionToken() {
  const supabase = await ensureClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return {
    accessToken: data.session.access_token,
    user: data.session.user,
  };
}

export async function signOutUser() {
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (e) {
    void 0;
  }
}

export function isConfigured() {
  return client !== null;
}

window.__supabaseClient = {
  signInWithGoogle,
  getSessionToken,
  signOutUser,
  isConfigured,
};

// Legacy global exports
window.signInWithGoogle = signInWithGoogle;
window.getSessionToken = getSessionToken;
window.signOutUser = signOutUser;
window.isConfigured = isConfigured;
