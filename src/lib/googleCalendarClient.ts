/**
 * Browser-side Google Calendar read access (GIS token + Calendar API).
 * Configure `VITE_GOOGLE_CLIENT_ID` in `.env.local` (OAuth Web client with authorized JS origins).
 */

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

export {};

const GIS_SRC = "https://accounts.google.com/gsi/client";
const READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

const TOKEN_KEY = "continuum_google_cal_token";
const TOKEN_EXP_KEY = "continuum_google_cal_token_exp_ms";

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

let gsiLoadPromise: Promise<void> | null = null;

export function getStoredGoogleAccessToken(): string | null {
  try {
    const exp = sessionStorage.getItem(TOKEN_EXP_KEY);
    const tok = sessionStorage.getItem(TOKEN_KEY);
    if (!tok || !exp) return null;
    if (Date.now() > Number(exp) - 60_000) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_EXP_KEY);
      return null;
    }
    return tok;
  } catch {
    return null;
  }
}

export function clearStoredGoogleAccessToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXP_KEY);
  } catch {
    /* ignore */
  }
}

function storeToken(accessToken: string, expiresInSec?: number): void {
  const expMs = Date.now() + (expiresInSec ?? 3600) * 1000;
  try {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(TOKEN_EXP_KEY, String(expMs));
  } catch {
    /* ignore */
  }
}

export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google script failed")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Google Identity script"));
    document.head.appendChild(s);
  });
  return gsiLoadPromise;
}

export function requestGoogleCalendarAccessToken(): Promise<string> {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  if (!clientId) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_CLIENT_ID"));
  }
  return loadGoogleIdentityScript().then(
    () =>
      new Promise((resolve, reject) => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) {
          reject(new Error("Google Identity Services not available"));
          return;
        }
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: READONLY_SCOPE,
          callback: (resp: TokenResponse) => {
            if (resp.error || !resp.access_token) {
              reject(new Error(resp.error ?? "No access token"));
              return;
            }
            storeToken(resp.access_token, resp.expires_in);
            resolve(resp.access_token);
          },
        });
        client.requestAccessToken({ prompt: "" });
      }),
  );
}

export async function fetchPrimaryCalendarEvents(
  accessToken: string,
  timeMin: Date,
  timeMax: Date,
): Promise<GoogleCalendarListItem[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 401) {
    clearStoredGoogleAccessToken();
    throw new Error("Google Calendar session expired — connect again.");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Calendar API error (${res.status})`);
  }
  const body = (await res.json()) as { items?: GoogleCalendarListItem[] };
  return body.items ?? [];
}
