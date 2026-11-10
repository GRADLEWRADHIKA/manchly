import { Router } from "express";
import { StorefrontController } from "../controllers/storefrontController";

const router = Router();

/**
 * Public storefront API — no auth. Everything here is readable by anyone,
 * so the controller only ever selects fields meant for a public page.
 */

/** @route GET /public/handle/check?handle=abhishek — signup availability check */
router.get("/handle/check", StorefrontController.checkHandle);

/** @route GET /public/storefront/:handle — creator profile + full catalog */
router.get("/storefront/:handle", StorefrontController.getStorefront);

/** @route GET /public/storefront/:handle/availability — bookable 1:1 slots */
router.get("/storefront/:handle/availability", StorefrontController.getAvailability);

export default router;
