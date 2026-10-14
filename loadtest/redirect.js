
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

const failures = new Counter("redirect_failures");

export const options = {
  stages: [
    { duration: "15s", target: 10 },
    { duration: "20s", target: 25 },
    { duration: "20s", target: 50 },
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
    redirect_failures: ["count==0"],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL;
  const slug = __ENV.SLUG;

  if (!baseUrl || !slug) {
    throw new Error("Set BASE_URL and SLUG before running k6");
  }

  const response = http.get(`${baseUrl}/${slug}`, {
    redirects: 0,
    tags: { endpoint: "redirect" },
  });

  const passed = check(response, {
    "redirect returns 302": (r) => r.status === 302,
    "Location header is correct": (r) =>
      r.headers.Location === "https://example.com/",
  });

  if (!passed) {
    failures.add(1);
  }

  sleep(0.1);
}
