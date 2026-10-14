import bcrypt from "bcryptjs";
import { findUserByEmail, createUser } from "../dao/user.dao.js";
import { signAccessToken, signRefreshToken } from "../utils/herlper.js";
import { ConflictError, UnauthorizedError } from "../utils/errorhandler.js";
import { sanitizeUser } from "../utils/user.js";

export const register_user = async (name, email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await createUser(name, normalizedEmail, hashedPassword);

  return {
    accessToken: signAccessToken({ id: newUser._id.toString() }),
    refreshToken: signRefreshToken({ id: newUser._id.toString() }),
    user: sanitizeUser(newUser),
  };
};

export const login_user = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(normalizedEmail, true);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return {
    accessToken: signAccessToken({ id: user._id.toString() }),
    refreshToken: signRefreshToken({ id: user._id.toString() }),
    user: sanitizeUser(user),
  };
};
