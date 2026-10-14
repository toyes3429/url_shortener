import { BadRequestError, ServiceUnavailableError } from "./errorhandler.js";

const normalizeHostname = (hostname) => hostname.toLowerCase().replace(/\.$/, "");

const matchesDomain = (hostname, domain) => {
  const normalizedDomain = normalizeHostname(domain.trim());
  return normalizedDomain && (
    hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
  );
};

const isPrivateIpv4 = (hostname) => {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0;
};

export const checkUrlSafety = async (urlValue) => {
  const url = new URL(urlValue);
  const hostname = normalizeHostname(url.hostname);

  const ownDomain = process.env.APP_URL
    ? (() => {
        try {
          return new URL(process.env.APP_URL).hostname;
        } catch {
          return "";
        }
      })()
    : "";

  if (ownDomain && matchesDomain(hostname, ownDomain)) {
    throw new BadRequestError("You cannot shorten a URL on this service's own domain");
  }

  const configuredBlockedDomains = (process.env.BLOCKED_DOMAINS || "")
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);
  const blockedDomains = [
    "localhost",
    "localhost.localdomain",
    "metadata.google.internal",
    ...configuredBlockedDomains,
  ];

  if (
    (hostname === "::1" || hostname === "[::1]") ||
    hostname === "0.0.0.0" ||
    hostname === "127.0.0.1" ||
    isPrivateIpv4(hostname) ||
    blockedDomains.some((domain) => matchesDomain(hostname, domain))
  ) {
    throw new BadRequestError("This destination domain is not allowed");
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return;

  let response;
  try {
    response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify({
          client: {
            clientId: "url-shortener",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: url.toString() }],
          },
        }),
      }
    );
  } catch {
    throw new ServiceUnavailableError("URL safety verification failed; please try again");
  }

  if (!response.ok) {
    throw new ServiceUnavailableError("URL safety verification failed; please try again");
  }

  const result = await response.json();
  if (Array.isArray(result.matches) && result.matches.length > 0) {
    throw new BadRequestError("This destination was flagged as unsafe");
  }
};
