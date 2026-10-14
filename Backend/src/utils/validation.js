import { BadRequestError } from "./errorhandler.js";

export const validateUrl = (value) => {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    throw new BadRequestError("URL must be between 1 and 2048 characters");
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new BadRequestError("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new BadRequestError("Only HTTP and HTTPS URLs are allowed");
  }

  return parsed.toString();
};

export const validateUrlBody = (req, res, next) => {
  try {
    const rawUrl = req?.body?.url;
    req.body.url = validateUrl(rawUrl);
    next();
  } catch (error) {
    next(error);
  }
};
const reservedSlugs = new Set([
  "api",
  "login",
  "register",
  "refresh",
  "logout",
  "dashboard",
  "favicon"
]);
export const validateSlug = (value) => {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{3,32}$/.test(value)) {
    throw new BadRequestError(
      "Slug must be 3-32 characters and contain only letters, numbers, '-' or '_'"
    );
  }

  if (reservedSlugs.has(value.toLowerCase())) {
    throw new BadRequestError("This slug is reserved");
  }

  return value;
};
