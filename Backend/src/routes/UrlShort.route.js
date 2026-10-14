import { Router } from "express";
import { createShortUrl, createCustomShortUrl } from "../controller/UrlShort.controller.js";
import { redirectfromShortUrl } from "../controller/UrlShort.controller.js";
import { validateUrlBody } from "../utils/validation.js";
const router = Router();

router.post("/", validateUrlBody, createShortUrl);
router.post("/custom", validateUrlBody, createCustomShortUrl);
router.get("/:id", redirectfromShortUrl);

export default router;
