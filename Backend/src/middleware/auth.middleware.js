import { verifyAccessToken } from "../utils/herlper.js";
import { findUserById } from "../dao/user.dao.js";

export const authmiddleware = async (req, res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
