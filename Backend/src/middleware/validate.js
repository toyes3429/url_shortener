import { BadRequestError } from "../utils/errorhandler.js";

export const validateAuthInput = (req, res, next) => {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 80
  ) {
    throw new BadRequestError("Name must be between 2 and 80 characters");
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new BadRequestError("A valid email is required");
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw new BadRequestError("Password must be between 8 and 128 characters");
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    throw new BadRequestError("A valid email is required");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new BadRequestError("Password is required");
  }

  next();
};
