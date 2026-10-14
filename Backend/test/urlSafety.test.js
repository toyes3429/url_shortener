import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { checkUrlSafety } from "../src/utils/urlSafety.js";

const originalEnv = {
  APP_URL: process.env.APP_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  BLOCKED_DOMAINS: process.env.BLOCKED_DOMAINS,
  GOOGLE_SAFE_BROWSING_API_KEY: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
};

beforeEach(() => {
  process.env.APP_URL = "https://short.example";
  process.env.FRONTEND_URL = "https://app.example";
  process.env.BLOCKED_DOMAINS = "blocked.test";
  delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("checkUrlSafety", () => {
  test("rejects the shortener's own domain and subdomains", async () => {
    await expect(checkUrlSafety("https://short.example/path")).rejects.toThrow(
      "own domain"
    );
    await expect(checkUrlSafety("https://sub.short.example/path")).rejects.toThrow(
      "own domain"
    );
  });

  test("rejects configured blocked domains", async () => {
    await expect(checkUrlSafety("https://sub.blocked.test/path")).rejects.toThrow(
      "not allowed"
    );
  });

  test("rejects private IPv4 destinations", async () => {
    await expect(checkUrlSafety("http://192.168.1.10/admin")).rejects.toThrow(
      "not allowed"
    );
  });

  test("allows an ordinary public destination when it is not blocklisted", async () => {
    await expect(checkUrlSafety("https://example.org/path")).resolves.toBeUndefined();
  });
});
