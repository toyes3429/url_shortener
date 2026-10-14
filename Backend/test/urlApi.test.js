
import { describe, expect, test } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("API integration tests", () => {
  test("GET /health returns 200 and status ok", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  test("GET /:id rejects an invalid slug", async () => {
    const response = await request(app).get("/ab");

    expect(response.status).toBe(404);
  });
});
