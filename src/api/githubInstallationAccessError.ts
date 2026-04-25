import axios from "axios";

type ApiErrorBody = {
  detail?: string | Array<{ msg?: string }>;
  error?: string;
  code?: string;
};

function responseDetailText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as ApiErrorBody;
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail
      .map((item) =>
        item && typeof item === "object" && "msg" in item && typeof item.msg === "string"
          ? item.msg
          : "",
      )
      .filter(Boolean)
      .join(" ");
  }
  if (typeof d.error === "string") return d.error;
  return "";
}

const OAUTH_EXPIRED_HINT =
  /expired|revoked|invalid[_\s-]?grant|re-?author|reconnect|not valid|bad_verification_code|token was revoked|installation[_\s-]?suspended|missing[_\s-]?scope/i;

/**
 * True when listing installation repos failed because GitHub user-to-server access
 * is missing, revoked, or stale — the user should reconnect via OAuth rather than only
 * reading a generic error.
 *
 * Uses HTTP status (401/422), optional backend `code`, and common OAuth error substrings
 * in `detail` (403 with a matching body is treated as reconnect; plain 403 is not).
 */
export function isGithubInstallationAccessExpiredError(err: unknown): boolean {
  if (!axios.isAxiosError(err) || err.response == null) return false;
  const { status, data } = err.response;
  if (status === 404) return false;
  const bodyText = `${responseDetailText(data)}`.toLowerCase();
  const code = typeof (data as ApiErrorBody)?.code === "string" ? String((data as ApiErrorBody).code) : "";
  if (/github_oauth|token_expired|installation_invalid|oauth_refresh/i.test(code)) return true;
  if (status === 401 || status === 422) return true;
  if (status === 403 && OAUTH_EXPIRED_HINT.test(bodyText)) return true;
  return false;
}
