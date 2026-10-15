import { describe, expect, it } from 'vitest';

const loadCookieConfig = async (envOverrides = {}) => {
  const originalEnv = { ...process.env };

  try {
    process.env = { ...process.env, ...envOverrides };

    const configPath = new URL('../src/config/config.js', import.meta.url);
    const moduleUrl = `${configPath.href}?t=${Date.now()}`;
    return await import(moduleUrl);
  } finally {
    process.env = originalEnv;
  }
};

describe('cookie config', () => {
  it('uses cross-site cookie settings when the frontend is hosted on a different domain', async () => {
    const mod = await loadCookieConfig({
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://app.example.com',
    });

    expect(mod.accessCookieOptions.sameSite).toBe('none');
    expect(mod.accessCookieOptions.secure).toBe(true);
    expect(mod.refreshCookieOptions.sameSite).toBe('none');
    expect(mod.refreshCookieOptions.secure).toBe(true);
  });
});
