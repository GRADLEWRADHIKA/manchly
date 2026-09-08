import { Router } from "express";
import { StorefrontController } from "../controllers/storefrontController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

router.get("/storefront/me", jwtAuth, StorefrontController.getMyStorefront);

router.put("/storefront/me", jwtAuth, StorefrontController.updateMyStorefront);

export default router;