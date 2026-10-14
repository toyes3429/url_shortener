import mongoose from "mongoose";
import {
  createShortUrlService,
  createShortUrlWithUser,
} from "../service/UrlShort.service.js";
import {
  findUrlFromShortUrl,
  incrementUrlClicks,
  updateUserUrl,
  deleteUserUrl,
} from "../dao/Url_short.js";
import wrapAsync from "../utils/tryCatchWrapper.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "../utils/errorhandler.js";
import { validateUrl, validateSlug } from "../utils/validation.js";
import { checkUrlSafety } from "../utils/urlSafety.js";
import { safeRedisGet, safeRedisSet, safeRedisDel } from "../config/redis.js";

const NEGATIVE_CACHE_VALUE = "__NOT_FOUND__";
const NEGATIVE_CACHE_TTL_SECONDS = 30;

const getAppUrl = (slug) => {
  const baseUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${baseUrl}/${slug}`;
};

const validateExpiration = (expiresAtValue) => {
  if (expiresAtValue === undefined || expiresAtValue === null || expiresAtValue === "") {
    return null;
  }

  const expiresAt = new Date(expiresAtValue);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    throw new BadRequestError("Expiration date must be in the future");
  }
  return expiresAt;
};

export const createShortUrl = wrapAsync(async (req, res) => {
  const url = validateUrl(req.body?.url);
  await checkUrlSafety(url);
  const expiresAt = validateExpiration(req.body?.expires_at);
  const userId = req.user?._id || null;
  const shortUrl = await createShortUrlService(url, userId, expiresAt);

  await safeRedisDel(`url:${shortUrl.short_url}`);

  return res.status(201).json({
    shortUrl: getAppUrl(shortUrl.short_url),
  });
});

export const redirectfromShortUrl = wrapAsync(async (req, res) => {
  const { id } = req.params;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{3,32}$/.test(id)) {
    throw new NotFoundError("URL not found");
  }

  const cacheKey = `url:${id}`;
  const cachedValue = await safeRedisGet(cacheKey);
  if (cachedValue === null) {
  console.log("CACHE MISS:", id);
} else if (cachedValue === NEGATIVE_CACHE_VALUE) {
  console.log("NEGATIVE CACHE HIT:", id);
} else {
  console.log("CACHE HIT:", id);
}

  if (cachedValue === NEGATIVE_CACHE_VALUE) {
    throw new NotFoundError("URL not found");
  }

  if (cachedValue) {
    try {
      const cached = JSON.parse(cachedValue);
      if (cached?.fullUrl) {
        if (cached.expiresAt && cached.expiresAt <= Date.now()) {
          await safeRedisDel(cacheKey);
          throw new NotFoundError("URL has expired");
        }

        incrementUrlClicks(id).catch((error) => {
          console.error("Click update failed:", error.message);
        });
        return res.redirect(cached.fullUrl);
      }
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      // Legacy cache entries are rechecked against MongoDB below.
    }
  }

  const url = await findUrlFromShortUrl(id);

  if (!url) {
    await safeRedisSet(cacheKey, NEGATIVE_CACHE_VALUE, {
      EX: NEGATIVE_CACHE_TTL_SECONDS,
    });
    throw new NotFoundError("URL not found");
  }

  if (url.expires_at && url.expires_at <= new Date()) {
    await safeRedisDel(cacheKey);
    throw new NotFoundError("URL has expired");
  }

  incrementUrlClicks(id).catch((error) => {
    console.error("Click update failed:", error.message);
  });

  const ttl = url.expires_at
    ? Math.floor((url.expires_at.getTime() - Date.now()) / 1000)
    : 3600;

  if (ttl > 0) {
    await safeRedisSet(
      cacheKey,
      JSON.stringify({
        fullUrl: url.full_url,
        expiresAt: url.expires_at ? url.expires_at.getTime() : null,
      }),
      { EX: ttl }
    );
  }

  return res.redirect(url.full_url);
});

export const createCustomShortUrl = wrapAsync(async (req, res) => {
  const url = validateUrl(req.body?.url);
  await checkUrlSafety(url);
  const slug = validateSlug(req.body?.slug);
  const expiresAt = validateExpiration(req.body?.expires_at);
  const userId = req.user?._id || null;

  try {
    const shortCode = await createShortUrlWithUser(url, userId, slug, expiresAt);
    await safeRedisDel(`url:${shortCode}`);

    return res.status(201).json({
      shortUrl: getAppUrl(shortCode),
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ConflictError("Slug already exists");
    }
    throw error;
  }
});

export const updateShortUrl = wrapAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new BadRequestError("Invalid URL id");
  }

  const updates = {};
  if (Object.hasOwn(req.body || {}, "url")) {
    updates.full_url = validateUrl(req.body.url);
    await checkUrlSafety(updates.full_url);
  }
  if (Object.hasOwn(req.body || {}, "expires_at")) {
    updates.expires_at = validateExpiration(req.body.expires_at);
  }

  if (Object.keys(updates).length === 0) {
    throw new BadRequestError("Provide a URL or expiration date to update");
  }

  const updatedUrl = await updateUserUrl(id, req.user._id, updates);
  if (!updatedUrl) {
    throw new NotFoundError("URL not found");
  }

  await safeRedisDel(`url:${updatedUrl.short_url}`);
  return res.status(200).json({ url: updatedUrl });
});

export const deleteShortUrl = wrapAsync(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new BadRequestError("Invalid URL id");
  }

  const deletedUrl = await deleteUserUrl(id, req.user._id);
  if (!deletedUrl) {
    throw new NotFoundError("URL not found");
  }

  await safeRedisDel(`url:${deletedUrl.short_url}`);
  return res.status(200).json({ message: "URL deleted successfully" });
});
