import jwt from "jsonwebtoken";
import { accessTokenOptions, refreshTokenOptions } from "../config/config.js";

const getSecret = (name) => {
  const secret = process.env[name];
  if (!secret) {
    throw new Error(`${name} is not configured`);
  }
  return secret;
};

export const signAccessToken = (payload) =>
  jwt.sign(payload, getSecret("JWT_ACCESS_SECRET"), accessTokenOptions);

export const signRefreshToken = (payload) =>
  jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), refreshTokenOptions);

export const verifyAccessToken = (token) =>
  jwt.verify(token, getSecret("JWT_ACCESS_SECRET"));

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getSecret("JWT_REFRESH_SECRET"));
