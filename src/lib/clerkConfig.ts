/**
 * Clerk is configured via two optional env vars (see .env.example):
 * - VITE_CLERK_PUBLISHABLE_KEY: enables ClerkProvider and the Clerk-backed login UI.
 * - VITE_CLERK_JWT_TEMPLATE: name of the Clerk JWT template used when minting a
 *   backend bearer token. When unset the default session token is sent.
 *
 * When the publishable key is missing the app falls back to the legacy
 * email/password flow so this branch still builds and runs without Clerk
 * credentials.
 */

const RAW_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const RAW_JWT_TEMPLATE = import.meta.env.VITE_CLERK_JWT_TEMPLATE;

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export const clerkPublishableKey: string | null = normalize(RAW_PUBLISHABLE_KEY);
export const clerkJwtTemplate: string | null = normalize(RAW_JWT_TEMPLATE);
export const isClerkEnabled: boolean = clerkPublishableKey !== null;
