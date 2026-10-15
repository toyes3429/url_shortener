export const accessTokenOptions = {
  expiresIn: "15m",
};

export const refreshTokenOptions = {
  expiresIn: "7d",
};

const isProduction = process.env.NODE_ENV === "production";

export const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 1000 * 60 * 15,
  path: "/",
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/api/auth",
};
