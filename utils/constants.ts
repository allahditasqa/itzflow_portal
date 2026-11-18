// Shared constants: things that are written repeatedly in tests, kept in one place.

// "Logged out" browser (no cookies or storage). For the login page tests: test.use({ storageState: LOGGED_OUT })
export const LOGGED_OUT = { cookies: [], origins: [] };

// URL patterns used in toHaveURL()
export const ROUTE = {
  login: /\/login/,
  workspaces: /\/workspaces\//,
  myWork: /\/my-work/,
};
