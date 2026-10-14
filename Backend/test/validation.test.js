import { test, expect } from "vitest";
import { validateUrl, validateUrlBody } from "../src/utils/validation.js";

test("validateUrl accepts a real URL string", () => {
  expect(validateUrl("https://www.google.com"))
    .toBe("https://www.google.com/");
});

test("validateUrlBody reads req.body.url and forwards it", () => {
  let nextCalled = false;
  const req = { body: { url: "https://www.google.com" } };

  validateUrlBody(req, {}, () => {
    nextCalled = true;
  });

  expect(req.body.url).toBe("https://www.google.com/");
  expect(nextCalled).toBe(true);
});