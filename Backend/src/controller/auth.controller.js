import wrapAsync from "../utils/tryCatchWrapper.js";
import {
  register_user as registerService,
  login_user as loginService,
} from "../service/auth.service.js";
import {
  accessCookieOptions,
  refreshCookieOptions,
} from "../config/config.js";
import { findUserById } from "../dao/user.dao.js";
import { verifyRefreshToken, signAccessToken } from "../utils/herlper.js";
import { UnauthorizedError } from "../utils/errorhandler.js";
import { getUserUrls as getUserUrlsFromDao } from "../dao/Url_short.js";

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);
};

export const register_user = wrapAsync(async (req, res) => {
  const { name, email, password } = req.body;
  const { accessToken, refreshToken, user } = await registerService(
    name,
    email,
    password
  );

  setAuthCookies(res, accessToken, refreshToken);
  res.status(201).json({ message: "Registration successful", user });
});

export const login_user = wrapAsync(async (req, res) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await loginService(
    email,
    password
  );

  setAuthCookies(res, accessToken, refreshToken);
  res.status(200).json({ message: "Login successful", user });
});

export const refresh_access_token = wrapAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new UnauthorizedError("Refresh token missing");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const user = await findUserById(decoded.id);
  if (!user) {
    throw new UnauthorizedError("Unauthorized");
  }

  const accessToken = signAccessToken({ id: user._id.toString() });
  res.cookie("accessToken", accessToken, accessCookieOptions);

  return res.status(200).json({ message: "Access token refreshed" });
});

export const getCurrentUser = wrapAsync(async (req, res) => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  return res.status(200).json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
  });
});

export const logout_user = wrapAsync(async (req, res) => {
  res.clearCookie("accessToken", accessCookieOptions);
  res.clearCookie("refreshToken", refreshCookieOptions);
  return res.status(200).json({ message: "Logout successful" });
});

export const getUserUrls = wrapAsync(async (req, res) => {
  const requestedPage = Number.parseInt(req.query.page, 10) || 1;
  const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
  const page = Math.max(1, requestedPage);
  const limit = Math.min(50, Math.max(1, requestedLimit));
  const result = await getUserUrlsFromDao(req.user._id, page, limit);

  return res.status(200).json(result);
});
