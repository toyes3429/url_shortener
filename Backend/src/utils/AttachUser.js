import { verifyAccessToken } from "./herlper.js";
import { findUserById } from "../dao/user.dao.js";

export const AttachUser = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.id);

    if (user) {
      req.user = user;
    }
  } catch {
    // Optional authentication: continue as anonymous.
  }

  next();
};
