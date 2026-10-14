import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

import urlRoutes from "./src/routes/UrlShort.route.js";
import auth_routes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import { redirectfromShortUrl } from "./src/controller/UrlShort.controller.js";
import { errorHandler } from "./src/utils/errorhandler.js";
import { AttachUser } from "./src/utils/AttachUser.js";

const app = express();

if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets are not configured");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Try again later." },
});

const createUrlLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many URL creation requests. Try again later." },
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authLimiter, auth_routes);
app.use("/api/user", userRoutes);
app.use("/api/create", createUrlLimiter, AttachUser, urlRoutes);

app.get("/:id", redirectfromShortUrl);

app.use(errorHandler);

export default app;