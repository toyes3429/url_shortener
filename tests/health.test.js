import { describe, it, expect } from "vitest";
import request from "supertest";

process.env.JWT_ACCESS_SECRET ||= "test-access-secret-for-health-tests";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-for-health-tests";

const { default: app } = await import("../Backend/app.js");

describe("GET /health", () => {
  it("returns the API health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
