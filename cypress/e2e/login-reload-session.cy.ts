/// <reference types="cypress" />

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;

function assertNoJwtInStorage(area: 'localStorage' | 'sessionStorage') {
  cy.window().then((win) => {
    const storage = win[area];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key) continue;
      const value = storage.getItem(key) ?? '';
      expect(JWT_PATTERN.test(key), `${area} key "${key}" should not contain a JWT`).to.be.false;
      expect(JWT_PATTERN.test(value), `${area} value at "${key}" should not contain a JWT`).to.be.false;
      // Belt-and-braces: the app should not be persisting anything under access/refresh-token-shaped keys.
      expect(/access[_-]?token|refresh[_-]?token|bearer/i.test(key), `${area} key "${key}" looks token-related`).to.be
        .false;
    }
  });
}

function assertNoJwtInUrl() {
  cy.location().should((loc) => {
    expect(JWT_PATTERN.test(loc.href), `URL should not contain a JWT: ${loc.href}`).to.be.false;
    expect(loc.hash, 'URL hash should not contain access_token').not.to.match(/access[_-]?token/i);
    expect(loc.search, 'URL search should not contain access_token').not.to.match(/access[_-]?token/i);
  });
}

describe('Login, reload, and session restoration', () => {
  const email = Cypress.env('TEST_EMAIL') as string | undefined;
  const password = Cypress.env('TEST_PASSWORD') as string | undefined;

  before(() => {
    if (!email || !password) {
      throw new Error(
        'Set CYPRESS_TEST_EMAIL and CYPRESS_TEST_PASSWORD env vars (or pass --env TEST_EMAIL=...,TEST_PASSWORD=...) to run this spec.',
      );
    }
  });

  beforeEach(() => {
    // Start each test with no app-level persistence so we can prove the refresh cookie is what restores the session.
    cy.clearLocalStorage();
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it('logs in, restores session after reload via refresh cookie, and never stores JWTs client-side', () => {
    cy.visit('/login');

    cy.get('input#email').type(email!);
    cy.get('input#password').type(password!, { log: false });
    cy.get('button[type="submit"]').click();

    // Login resolves into /loading then a protected route — wait until we're off /login.
    cy.location('pathname', { timeout: 20_000 }).should((pathname) => {
      expect(pathname).not.to.eq('/login');
    });

    // Wait for the auth bootstrap to settle on a real protected surface.
    cy.location('pathname', { timeout: 20_000 }).should((pathname) => {
      expect(pathname).not.to.match(/^\/(login|loading)$/);
    });

    // The refresh token must be set as an HttpOnly cookie by the backend. We can't read HttpOnly cookies
    // from JS, but Cypress's cookie jar can. Verify at least one auth-shaped cookie is present.
    cy.getCookies().should((cookies) => {
      const hasAuthCookie = cookies.some((c) =>
        /(refresh|session|auth)/i.test(c.name),
      );
      expect(hasAuthCookie, `expected an auth cookie, got: ${cookies.map((c) => c.name).join(', ')}`).to.be.true;
    });

    assertNoJwtInStorage('localStorage');
    assertNoJwtInStorage('sessionStorage');
    assertNoJwtInUrl();

    cy.location('pathname').then((postLoginPath) => {
      cy.reload();

      // After reload, the in-memory access token is gone. The app must use the HttpOnly refresh cookie
      // to silently re-authenticate and land back on the same protected route — not bounce to /login.
      cy.location('pathname', { timeout: 20_000 }).should((pathname) => {
        expect(pathname, 'should not be redirected to /login after reload').not.to.eq('/login');
      });
      cy.location('pathname', { timeout: 20_000 }).should((pathname) => {
        expect(pathname).to.eq(postLoginPath);
      });

      // Same invariants must hold after the silent refresh.
      assertNoJwtInStorage('localStorage');
      assertNoJwtInStorage('sessionStorage');
      assertNoJwtInUrl();
    });
  });
});
