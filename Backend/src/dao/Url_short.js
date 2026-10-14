import urlSchema from "../models/UrlSchema.model.js";

export const saveShortUrl = async (url, short_url, userId = null, expiresAt = null) => {
  const payload = {
    full_url: url,
    short_url,
    expires_at: expiresAt,
  };

  if (userId) payload.user = userId;

  const newUrl = new urlSchema(payload);
  await newUrl.save();
  return newUrl;
};

export const findUrlFromShortUrl = async (short_url) => {
  return urlSchema.findOne({ short_url });
};

export const getCustomUrl = async (slug) => {
  return urlSchema.findOne({ short_url: slug });
};

export const incrementUrlClicks = async (short_url) => {
  return urlSchema.updateOne(
    { short_url },
    { $inc: { clicks: 1 } }
  );
};

export const getUserUrls = async (userId, page = 1, limit = 10) => {
  const filter = { user: userId };
  const [urls, total] = await Promise.all([
    urlSchema
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    urlSchema.countDocuments(filter),
  ]);

  return {
    urls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
};

export const updateUserUrl = async (id, userId, updates) => {
  return urlSchema.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: updates },
    { new: true, runValidators: true }
  );
};

export const deleteUserUrl = async (id, userId) => {
  return urlSchema.findOneAndDelete({ _id: id, user: userId });
};
