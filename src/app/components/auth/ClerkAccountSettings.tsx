import { useClerk, useUser } from '@clerk/clerk-react';

import { Button } from '@/app/components/ui/button';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  apple: 'Apple',
  github: 'GitHub',
  gitlab: 'GitLab',
  microsoft: 'Microsoft',
  email: 'Email & password',
  emailaddress: 'Email & password',
  password: 'Email & password',
  oauth_google: 'Google',
  oauth_apple: 'Apple',
  oauth_github: 'GitHub',
  oauth_microsoft: 'Microsoft',
};

function prettyProviderLabel(raw: string): string {
  const normalized = raw.toLowerCase();
  return PROVIDER_LABELS[normalized] ?? raw.replace(/^oauth_/, '').replace(/_/g, ' ');
}

/**
 * "Account" section of the Settings modal when Clerk is active. Surfaces the
 * Clerk-managed identity (email + connected social providers) and routes
 * account management actions (open profile, sign out) through Clerk's SDK.
 *
 * Only mounted when `isClerkEnabled`, so the Clerk hooks always resolve.
 */
export function ClerkAccountSettings() {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();

  if (!isLoaded) {
    return (
      <div className="font-['Satoshi',sans-serif] text-[14px] text-muted-foreground">
        Loading account…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="font-['Satoshi',sans-serif] text-[14px] text-muted-foreground">
        You are not signed in.
      </div>
    );
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress
    ?? user.emailAddresses[0]?.emailAddress
    ?? '—';
  const externalProviders = (user.externalAccounts ?? []).map((account) => ({
    id: account.id,
    label: prettyProviderLabel(account.provider ?? ''),
    email: account.emailAddress ?? null,
  }));
  const hasPasswordIdentity = user.passwordEnabled === true;

  return (
    <div className="flex flex-col gap-6 font-['Satoshi',sans-serif] text-[14px] text-foreground">
      <section className="flex flex-col gap-2">
        <h3 className="text-[16px] font-medium">Signed in as</h3>
        <p className="text-[14px] text-muted-foreground">{primaryEmail}</p>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="connected-accounts-heading">
        <h3 id="connected-accounts-heading" className="text-[16px] font-medium">
          Connected accounts
        </h3>
        {externalProviders.length === 0 && !hasPasswordIdentity ? (
          <p className="text-[14px] text-muted-foreground">
            No social accounts are linked yet. Add Google or Apple from the Clerk-managed account page.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {externalProviders.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium">{entry.label}</span>
                  {entry.email ? (
                    <span className="text-[12px] text-muted-foreground">{entry.email}</span>
                  ) : null}
                </div>
                <span className="text-[12px] uppercase tracking-wide text-muted-foreground">Linked</span>
              </li>
            ))}
            {hasPasswordIdentity ? (
              <li className="flex items-center justify-between rounded-[8px] border border-border bg-card px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium">Email &amp; password</span>
                  <span className="text-[12px] text-muted-foreground">{primaryEmail}</span>
                </div>
                <span className="text-[12px] uppercase tracking-wide text-muted-foreground">Enabled</span>
              </li>
            ) : null}
          </ul>
        )}
        <p className="text-[12px] text-muted-foreground">
          Add or remove identities (Google, Apple, email/password) from the secure account page below — Clerk handles the OAuth flow and revocation.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[16px] font-medium">Manage account</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => clerk.openUserProfile()}
          >
            Open account settings
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void clerk.signOut({ redirectUrl: '/login' });
            }}
          >
            Sign out everywhere
          </Button>
        </div>
        <p className="text-[12px] text-muted-foreground">
          “Open account settings” launches Clerk's secure profile dialog so you can change your password, link Google/Apple, or revoke sessions.
        </p>
      </section>
    </div>
  );
}
