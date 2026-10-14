import { Router } from "express";
import { getUserUrls } from "../controller/auth.controller.js";
import {
  deleteShortUrl,
  updateShortUrl,
} from "../controller/UrlShort.controller.js";
import { authmiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/urls", authmiddleware, getUserUrls);
router.patch("/urls/:id", authmiddleware, updateShortUrl);
router.delete("/urls/:id", authmiddleware, deleteShortUrl);

export default router;
