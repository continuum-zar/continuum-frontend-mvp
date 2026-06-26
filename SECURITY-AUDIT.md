# Continuum MVP – Frontend Security Audit

**Audit date:** 2026-06-10
**Branch:** `security-update`
**Scope:** Client-side codebase (`src/`, `index.html`, deploy configs, `package.json`)
**Stack:** Vite 6 + React 18 SPA, react-router 7, zustand 5, axios, TanStack Query
**Method:** Systematic review across XSS sinks, client-side storage, session/token management, routing/RBAC, cross-origin/request security, and dependency risk (`npm audit`). All High findings manually verified against source.

---

## Executive Summary

**Overall posture: Moderate risk — solid application code, weak platform hardening.**

The application code is well above average: no `eval`/`innerHTML` sinks, `react-markdown` runs without raw HTML, attachment URLs are protocol-validated, route guards are correctly treated as UX-only with server-side validation via `/users/me`, role checks come from server-validated responses (not client-decoded JWTs), and role-restricted queries are gated with `enabled:` flags so clients never fire PM/admin API calls. No secrets are committed.

Risk concentrates in three systemic decisions:

1. **The token threat model assumes XSS will never happen.** Both the access *and refresh* JWTs persist in plaintext `localStorage`, and access tokens are embedded in URL query strings for four SSE endpoints — landing them in browser history, proxy logs, and server access logs.
2. **There is zero HTTP security-header hardening.** No CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` in `nginx.conf.template`, `vercel.json`, or `index.html`.
3. **Dependencies are behind on known advisories**, including `react-router 7.13.0` (open-redirect + XSS advisories) and `mermaid 11.14.0` (HTML-injection advisories directly relevant to the `dangerouslySetInnerHTML` SVG rendering).

Findings H-1/H-2/H-3 compound each other: a single XSS anywhere becomes full account takeover (refresh token included), and there is no CSP to stop that first script from running.

---

## Vulnerability Register

**Remediation status (2026-06-10, branch `security-update`):** all findings fixed client-side except H-1 and H-2, which require backend endpoints (see each finding for the required backend work).

| ID | Severity | Finding | Location | Status |
|----|----------|---------|----------|--------|
| [H-1](#h-1) | **High** | Access + refresh JWTs persisted in plaintext `localStorage` | `src/store/authStore.ts:174-181`, `src/lib/api.ts:249-267` | ⏳ Needs backend (refresh-token cookie) |
| [H-2](#h-2) | **High** | Access tokens in SSE URL query strings (`?access_token=`) | `src/api/projectPresenceEvents.ts:22-33`, `src/api/deployments.ts:30-41`, `src/api/projectTaskEvents.ts:7-18`, `src/api/agent.ts:57-72` | ⏳ Needs backend (stream-ticket endpoint) |
| [H-3](#h-3) | **High** | No security headers (CSP, HSTS, XFO, nosniff, Referrer-Policy) | `nginx.conf.template`, `vercel.json`, `index.html` | ✅ Fixed — CSP shipped Report-Only; flip to enforcing after soak |
| [H-4](#h-4) | **High** | Vulnerable dependencies (react-router, mermaid, axios, lodash, follow-redirects) | `package.json` | ✅ Fixed — `npm audit --omit=dev` clean |
| [M-1](#m-1) | **Medium** | Backend-supplied SVG injected via `dangerouslySetInnerHTML` on a mermaid version with HTML-injection advisories | `src/app/components/planner/PlannerArchitectureSection.tsx:200-203` | ✅ Fixed — mermaid 11.15.0 + DOMPurify pass |
| [M-2](#m-2) | **Medium** | OAuth `redirect_url` passed to `window.location.assign()` with no scheme allowlist | `src/app/pages/McpOAuth.tsx:341-389` | ✅ Fixed — scheme allowlist |
| [M-3](#m-3) | **Medium** | Incomplete logout: Google Calendar token, MCP/invite session keys, and React Query cache survive logout | `src/store/authStore.ts:101-124`, `src/lib/googleCalendarClient.ts:48-75` | ✅ Fixed — full storage + query-cache purge |
| [L-1](#l-1) | Low | User-influenced Figma URL rendered into `href` without protocol validation | `src/app/pages/AIProjectPlanner.tsx:1374-1383` | ✅ Fixed — figma.com https allowlist |
| [L-2](#l-2) | Low | 5 external links use `rel="noreferrer"` without `noopener` | `BuildRunDrawer.tsx:228,359,633`, `ReviewRunDrawer.tsx:367`, `AIProjectPlanner.tsx:1374` | ✅ Fixed |
| [L-3](#l-3) | Low | Sidebar cookie set without `Secure`/`SameSite` | `src/app/components/ui/sidebar.tsx:86` | ✅ Fixed |
| [L-4](#l-4) | Low | Google Identity script injected from CDN with no CSP fencing | `src/lib/googleCalendarClient.ts:93-100` | ✅ Fixed via H-3 CSP |

**Clean areas (no findings):** postMessage handling (none exists), WebSockets (none), iframes (none), open redirects in routing, CSRF (Bearer-header auth → mitigated by design), committed secrets (`.env` contains only public keys).

**Recommended fix order:** H-3 → H-4 → H-2 → H-1 → M-1…L-4. (H-3 is the cheapest and mitigates everything else; H-1 needs the most backend coordination.)

---

## Detailed Findings

<a id="h-1"></a>
### H-1 — Refresh + access tokens in plaintext `localStorage`

**Severity:** High
**Files:** `src/store/authStore.ts:174-181` (persistence), `src/lib/api.ts:249-267` (read on every request)
**Backend changes required:** Yes (refresh-token cookie issuance)

**Impact:** Any XSS — including via a compromised npm dependency — reads `localStorage['auth-storage']` in one line and exfiltrates both tokens. The refresh token makes this a *persistent* account takeover that outlives the access token's expiry and the user's session. This finding converts every other Medium/Low into account takeover.

**Before (vulnerable)** — `src/store/authStore.ts:174-181`:

```typescript
{
    name: 'auth-storage',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
    }),
}
```

**After (secure)** — keep the access token in memory only; move the refresh token to an `HttpOnly; Secure; SameSite=Strict` cookie set by the backend (`POST /auth/refresh-token` then reads it from the cookie, not a query param):

```typescript
// authStore.ts — drop persist entirely for tokens; access token lives in memory
export const useAuthStore = create<AuthState>()((set, get) => ({
    accessToken: null,          // memory only — gone on tab close, invisible to storage scans
    // refreshToken removed from client state entirely
    ...
}));

// api.ts response interceptor — on 401, refresh via the HttpOnly cookie
const { data } = await axios.post('/api/v1/auth/refresh-token', null, {
    withCredentials: true,      // browser attaches the HttpOnly refresh cookie
});
useAuthStore.getState().setAccessToken(data.access_token);
```

The refresh endpoint then needs CSRF protection (`SameSite=Strict` plus an origin check).

**Interim client-only hardening** (if the backend can't change yet): switch `createJSONStorage(() => localStorage)` → `sessionStorage` so tokens die with the tab, and shorten access-token TTL server-side.

**Acceptance criteria:**
- [ ] No JWT (access or refresh) appears in `localStorage` or `sessionStorage` after login
- [ ] Refresh token is delivered as an `HttpOnly; Secure; SameSite=Strict` cookie
- [ ] Token refresh works across a hard reload (re-auth via cookie, not storage)
- [ ] Cross-tab refresh coordination (Web Locks / mutex in `api.ts`) still works

---

<a id="h-2"></a>
### H-2 — Access tokens in SSE URL query strings

**Severity:** High
**Files (URL builders):** `src/api/projectPresenceEvents.ts:22-33`, `src/api/deployments.ts:30-41`, `src/api/projectTaskEvents.ts:7-18`, `src/api/agent.ts:57-72`
**Usage sites:** `src/app/pages/Dashboard.tsx:255`, `src/app/components/deployments/DeploymentScheduledAlert.tsx:95`, `src/app/components/dashboard-placeholder/GetStartedKanbanLive.tsx:190`, `src/app/components/BuildRunDrawer.tsx:428`
**Backend changes required:** Yes (ticket-exchange endpoint) — unless the `fetch()`-streaming alternative is chosen

**Impact:** `?access_token=eyJ...` URLs are written to browser history, nginx/ALB access logs, corporate proxy logs, and any error-tracking breadcrumbs that capture URLs (a Sentry DSN ships with the app). A token harvested from any of those logs is replayable until expiry. The code comment in `projectPresenceEvents.ts:20` shows this was a known EventSource limitation (EventSource cannot send custom headers) — but the mitigation is missing.

**Before (vulnerable)** — `src/api/projectPresenceEvents.ts:22-25`:

```typescript
export function projectPresenceEventsStreamUrl(projectId: number | string, accessToken: string): string {
  const base = resolveApiBaseURL().replace(/\/$/, "");
  const qs = new URLSearchParams({ access_token: accessToken }).toString();
  const path = `${base}/projects/${projectId}/presence-events/stream`;
```

**After (secure)** — exchange the JWT for a single-use, short-lived (≤30 s), scope-limited stream ticket over an authenticated POST, and put only the ticket in the URL:

```typescript
// New: ticket exchange via the normal authed axios client (Authorization header)
export async function createStreamTicket(channel: string): Promise<string> {
  const { data } = await api.post<{ ticket: string }>('/events/ticket', { channel });
  return data.ticket;   // single-use, expires in 30s, scoped to this channel
}

export async function projectPresenceEventsStreamUrl(projectId: number | string): Promise<string> {
  const ticket = await createStreamTicket(`project:${projectId}:presence`);
  const base = resolveApiBaseURL().replace(/\/$/, "");
  return `${base}/projects/${projectId}/presence-events/stream?ticket=${encodeURIComponent(ticket)}`;
}
```

A leaked ticket is worthless seconds later and grants only one stream subscription.

**Alternative (no backend change):** replace `EventSource` with `fetch()` + `ReadableStream` parsing, which allows an `Authorization` header — more client code, no new endpoint.

Apply the same fix to all four URL builders and their usage sites.

**Acceptance criteria:**
- [ ] No long-lived JWT appears in any request URL (verify in DevTools network tab and server access logs)
- [ ] All four SSE streams (presence, deployments, task events, agent runs) still receive live events
- [ ] Stream reconnection after a dropped connection works (new ticket fetched on retry)

---

<a id="h-3"></a>
### H-3 — No security headers

**Severity:** High
**Files:** `nginx.conf.template` (Docker deploy), `vercel.json` (Vercel deploy), `index.html`
**Backend changes required:** No (deploy-config only)

**Impact:** No CSP means any injected script executes unrestricted (compounding H-1). No HSTS permits SSL-stripping on first visit. No `X-Frame-Options`/`frame-ancestors` permits clickjacking of the dashboard. No `X-Content-Type-Options` permits MIME sniffing. No `Referrer-Policy` directly worsens H-2 (token-bearing URLs in Referer headers).

**Before (vulnerable)** — `vercel.json` is rewrites-only; `nginx.conf.template` has only gzip and cache headers:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**After (secure)** — `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com https://*.ingest.us.sentry.io; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

Mirror the same as `add_header` directives in `nginx.conf.template` for the Docker path.

**Notes:**
- `style-src 'unsafe-inline'` is required for the chart `<style>` tag (`src/app/components/ui/chart.tsx`) and Tailwind-injected styles; mermaid SVGs use inline `style` attributes which CSP does not block by default.
- Tune `connect-src` to the real API origin if `VITE_API_BASE_URL` is cross-origin.
- Deploy as `Content-Security-Policy-Report-Only` first to catch breakage before enforcing.

**Acceptance criteria:**
- [ ] All six headers present on every response in both deploy targets (Vercel + Docker/nginx)
- [ ] CSP run in Report-Only mode for at least one release cycle with zero unexpected violations before enforcement
- [ ] Google Calendar connect flow, Sentry reporting, charts, and mermaid diagrams all function with CSP enforced

---

<a id="h-4"></a>
### H-4 — Vulnerable dependencies

**Severity:** High
**File:** `package.json`
**Backend changes required:** No

`npm audit` (production tree): **3 high, 2 moderate.**

| Package | Installed | Advisories | Relevance |
|---|---|---|---|
| `react-router` | 7.13.0 | Open redirect via `//` protocol-relative URLs (GHSA-2j2x-hqr9-3h42), XSS in redirect handling, DoS; fixed in 7.17.0 | **Direct.** The open-redirect applies client-side; the RCE/RSC advisories are SSR-only (this is a SPA) but patch anyway. |
| `mermaid` | 11.14.0 | HTML injection via `classDef` in state diagrams (GHSA-ghcm-xqfw-q4vr), CSS injection ×2, Gantt infinite-loop DoS | **Direct — see M-1.** Diagram source is backend/AI-generated and rendered into the DOM. |
| `axios` | <1.15.2 | Prototype-pollution gadgets in `validateStatus`/`parseReviver`, CRLF injection; SSRF advisories are Node-side | Direct; the pollution gadgets are browser-relevant. Fixed in 1.15.2. |
| `lodash` (transitive) | ≤4.17.23 | `_.template` code injection, `_.unset`/`_.omit` prototype pollution | Transitive. |
| `follow-redirects` (transitive) | — | Auth-header leak on cross-domain redirect | Transitive via axios. |

**Remediation:**

```bash
npm audit fix                                    # follow-redirects, lodash, mermaid
npm install axios@latest react-router@7.17.0     # react-router fix is outside the stated range; bump explicitly
```

Smoke-test routing after the react-router bump. Dev tree also has a low-severity eslint ReDoS (no production exposure).

**Acceptance criteria:**
- [ ] `npm audit --omit=dev` reports zero high/critical
- [ ] Routing (guards, lazy routes, redirects), API calls, and mermaid rendering smoke-tested after bumps
- [ ] CI gate added: `npm audit --omit=dev --audit-level=high` so this class of finding can't silently regress

---

<a id="m-1"></a>
### M-1 — Backend SVG injected via `dangerouslySetInnerHTML` (mermaid)

**Severity:** Medium
**File:** `src/app/components/planner/PlannerArchitectureSection.tsx:200-203`
**Backend changes required:** No

**Impact:** The component injects `mermaid.render()` output into the DOM. `securityLevel: 'strict'` is correctly set (line 20), but the installed mermaid version has advisories where `classDef`/config sanitization is bypassed *despite* strict mode — and the diagram text originates from an AI pipeline fed by user input (Figma URLs), i.e., indirectly attacker-influenceable via prompt injection.

**Before (vulnerable):**

```tsx
<div
  className="architecture-mermaid ..."
  dangerouslySetInnerHTML={{ __html: svgMarkup }}
/>
```

**After (secure)** — upgrade mermaid (H-4) **and** add a DOMPurify pass as defense-in-depth. Note: DOMPurify strips HTML content inside SVG `foreignObject` regardless of config, so mermaid must render native SVG `<text>` labels (`htmlLabels: false`) or diagram labels disappear:

```tsx
// mermaid.initialize: native SVG labels so the sanitizer can't blank them out
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  flowchart: { htmlLabels: false },
});

// in the render effect — loaded lazily like mermaid itself
const { default: DOMPurify } = await import('dompurify');
const safeSvg = DOMPurify.sanitize(svg, {
  USE_PROFILES: { svg: true, svgFilters: true },
});

<div className="architecture-mermaid ..." dangerouslySetInnerHTML={{ __html: safeSvg }} />
```

**Acceptance criteria:**
- [ ] mermaid upgraded past the advisory range (H-4)
- [ ] DOMPurify sanitization applied between `mermaid.render()` and DOM injection
- [ ] Architecture diagrams still render correctly (labels, edges, themes) — verify node labels are visible

---

<a id="m-2"></a>
### M-2 — OAuth redirect via `window.location.assign()` without scheme allowlist

**Severity:** Medium
**File:** `src/app/pages/McpOAuth.tsx:341-389` (also `fallbackRedirectUrl` href at line 465)
**Backend changes required:** No

**Impact:** The page navigates to a backend-supplied `redirect_url` with no client-side scheme check. If the consent endpoint ever echoes an unvalidated `redirect_uri` (or is compromised), `javascript:` executes and `data:`/arbitrary schemes navigate. The IDE deep-link use case (`cursor://`) is legitimate, so allowlist rather than restrict to http(s).

**Before (vulnerable):**

```typescript
const redirectUrl = data?.redirect_url?.trim();
...
window.location.assign(redirectUrl);
```

**After (secure):**

```typescript
const ALLOWED_REDIRECT_SCHEMES = ['https:', 'http:', 'cursor:', 'vscode:', 'vscode-insiders:'];

function isAllowedRedirect(url: string): boolean {
    try {
        return ALLOWED_REDIRECT_SCHEMES.includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

const redirectUrl = data?.redirect_url?.trim();
if (!redirectUrl || !isAllowedRedirect(redirectUrl)) {
    setError({ title: 'Invalid redirect address', description: <p>The server returned an unexpected redirect target.</p> });
    return;
}
window.location.assign(redirectUrl);
```

Apply the same check before rendering `fallbackRedirectUrl` as an `href`.

**Acceptance criteria:**
- [ ] `javascript:`/`data:` redirect URLs are rejected with the error UI
- [ ] `cursor://`, `vscode://`, and http(s) OAuth handoffs still work end-to-end
- [ ] The manual-handoff fallback link is also scheme-validated

---

<a id="m-3"></a>
### M-3 — Incomplete logout

**Severity:** Medium
**Files:** `src/store/authStore.ts:101-124`, `src/lib/googleCalendarClient.ts:48-75`
**Backend changes required:** No

**Impact:** Logout clears `auth-storage` and the time-recording key, but leaves behind: the Google Calendar OAuth access token (`googleCalendarClient.ts` storage keys), `continuum_invite_token`, MCP OAuth session keys, and the entire React Query cache (cached user/project/invoice data readable by the next user on a shared machine).

**Before (vulnerable):**

```typescript
} finally {
    set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, ... });
    localStorage.removeItem('auth-storage');
    try { localStorage.removeItem(TIME_RECORDING_STORAGE_KEY); } catch { }
}
```

**After (secure)** — storage keys imported from their canonical constants (no literal drift), and the React Query purge lives in `AuthQueryCacheSync` (App-mounted effect) rather than inside `logout()`: clearing the cache while protected pages are still mounted would make their query observers refetch without auth and trigger a 401 cascade. The effect runs after the auth flip unmounts them.

```typescript
// authStore.ts logout()
import { MCP_OAUTH_CLIENT_LABEL_KEY, MCP_OAUTH_SESSION_KEY } from '../lib/mcpOauthSessionKeys';
import { SESSION_INVITE_TOKEN_KEY } from '../app/components/welcome/welcomeModalAssets';

} finally {
    set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, ... });
    localStorage.removeItem('auth-storage');
    try {
        localStorage.removeItem(TIME_RECORDING_STORAGE_KEY);
        clearStoredGoogleAccessToken();
        sessionStorage.removeItem(SESSION_INVITE_TOKEN_KEY);
        sessionStorage.removeItem(MCP_OAUTH_SESSION_KEY);
        sessionStorage.removeItem(MCP_OAUTH_CLIENT_LABEL_KEY);
    } catch { /* noop */ }
}

// AuthQueryCacheSync.tsx — purges cached PII after protected pages unmount
useEffect(() => {
    if (!isAuthenticated) {
        queryClient.clear();
    }
}, [isAuthenticated, queryClient]);
```

**Acceptance criteria:**
- [ ] After logout, no `continuum_*` token/session keys remain in localStorage or sessionStorage
- [ ] React Query cache is empty after logout (verify with devtools)
- [ ] Logging in as a different user on the same browser shows no stale data from the previous user

---

<a id="l-1"></a>
### L-1 — Figma URL in `href` without protocol validation

**Severity:** Low
**File:** `src/app/pages/AIProjectPlanner.tsx:1374-1383`
**Backend changes required:** No

**Impact:** `figmaContext.url` (user input round-tripped through the backend) is rendered as a link. React does *not* block `javascript:` hrefs (dev-mode warning only). Exploitation requires the backend to echo a malicious URL and the user to click, hence Low.

**Before:**

```tsx
<a href={figmaContext.url} target="_blank" rel="noreferrer">Open Figma reference</a>
```

**After:**

```tsx
{figmaContext.url && /^https:\/\/(www\.)?figma\.com\//i.test(figmaContext.url) && (
  <a href={figmaContext.url} target="_blank" rel="noopener noreferrer">Open Figma reference</a>
)}
```

**Acceptance criteria:**
- [ ] Non-figma.com / non-https URLs do not render as links

---

<a id="l-2"></a>
### L-2 — `rel="noreferrer"` without `noopener` (5 links)

**Severity:** Low
**Files:** `src/app/components/BuildRunDrawer.tsx:228, 359, 633`, `src/app/components/ReviewRunDrawer.tsx:367`, `src/app/pages/AIProjectPlanner.tsx:1374`
**Backend changes required:** No

**Impact:** Reverse-tabnabbing hygiene. Modern browsers imply `noopener` on `target="_blank"`, so this is policy consistency rather than active exposure.

**Fix:** change `rel="noreferrer"` → `rel="noopener noreferrer"` in all five instances.

**Acceptance criteria:**
- [ ] No `target="_blank"` link in `src/` lacks `noopener` (add a grep/lint check)

---

<a id="l-3"></a>
### L-3 — Sidebar cookie without `Secure`/`SameSite`

**Severity:** Low
**File:** `src/app/components/ui/sidebar.tsx:86`
**Backend changes required:** No

**Impact:** Non-sensitive UI state (`sidebar_state=true|false`), but cookie flags should be set as a matter of policy.

**Before:**

```typescript
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
```

**After:**

```typescript
document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; Secure; SameSite=Lax`;
```

**Acceptance criteria:**
- [ ] Cookie carries `Secure; SameSite=Lax`; sidebar state still persists across reloads

---

<a id="l-4"></a>
### L-4 — Google Identity script without CSP fencing

**Severity:** Low
**File:** `src/lib/googleCalendarClient.ts:93-100`
**Backend changes required:** No (resolved by H-3)

**Impact:** The app injects `https://accounts.google.com/gsi/client` at runtime. SRI is **not** viable here (Google serves a rotating script), so the correct control is the CSP `script-src` allowlist from H-3, which pins script execution to `'self'` plus that one origin.

**Fix:** covered by H-3's CSP. No code change in this file.

**Acceptance criteria:**
- [ ] CSP `script-src` limited to `'self' https://accounts.google.com` and the calendar connect flow still works

---

## What's Already Done Right (preserve these)

- **Routing/RBAC:** `AuthGuard` validates against `/users/me` server-side; localStorage tampering yields only a UX bypass that immediately 401s. Roles come from the server response, never decoded client-side. All role-restricted queries use `enabled:` guards so restricted API calls never fire. Admin pages are dual-gated (query + render) and lazy-loaded.
- **XSS hygiene:** zero `eval`/`innerHTML`/`document.write`; `react-markdown` without `rehype-raw`; attachment links protocol-validated via `looksLikeHttpUrl()` (`src/api/mappers.ts:281`).
- **CSRF:** pure Bearer-header auth means classic cookie-riding CSRF doesn't apply. This must stay true if H-1's refresh-cookie is adopted — that endpoint will then need its own CSRF protection.
- **Secrets:** committed `.env` contains only public identifiers (OAuth client ID, Clerk publishable key, Sentry DSN).
