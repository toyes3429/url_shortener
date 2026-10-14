import { nanoid } from "nanoid";
import urlSchema from "../models/UrlSchema.model.js";
import { ConflictError } from "../utils/errorhandler.js";
import { getCustomUrl } from "../dao/Url_short.js";

export const createShortUrlService = async (url, userId = null, expiresAt = null) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generatedShortUrl = nanoid(8);

    try {
      const newUrl = new urlSchema({
        full_url: url,
        short_url: generatedShortUrl,
        expires_at: expiresAt,
        ...(userId ? { user: userId } : {}),
      });

      await newUrl.save();
      return newUrl;
    } catch (error) {
      if (error?.code !== 11000 || attempt === 4) {
        throw error;
      }
    }
  }

  throw new ConflictError("Could not generate a unique short URL");
};

export const createShortUrlWithUser = async (url, userId, slug = null, expiresAt = null) => {
  const generatedShortUrl = slug || nanoid(7);

  if (slug) {
    const existing = await getCustomUrl(slug);
    if (existing) {
      throw new ConflictError("Custom URL already exists");
    }
  }

  const newUrl = new urlSchema({
    full_url: url,
    short_url: generatedShortUrl,
    expires_at: expiresAt,
    ...(userId ? { user: userId } : {}),
  });

  try {
    await newUrl.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new ConflictError("Custom URL already exists");
    }
    throw error;
  }

  return generatedShortUrl;
};
