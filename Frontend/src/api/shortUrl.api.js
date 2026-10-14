import axiosInstance from "../utils/axiosInstance";

export const createShortUrl = async (url, slug = "", expiresAt = "") => {
  const endpoint = slug ? "/api/create/custom" : "/api/create";
  const payload = { url };

  if (slug) payload.slug = slug;
  if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();

  const { data } = await axiosInstance.post(endpoint, payload);
  return data.shortUrl;
};
