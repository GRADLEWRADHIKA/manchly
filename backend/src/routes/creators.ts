import { Router } from "express";
import { MarketplaceController } from "../controllers/marketplaceController";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireCreatorMarketplaceAccess } from "../middleware/creatorMarketplaceAccess";

const router = Router();

router.use(jwtAuth, requireCreatorMarketplaceAccess);

/**
 * Legacy alias routes — prefer /marketplace/creators/*
 * @deprecated Use /marketplace routes instead
 */
router.get("/", MarketplaceController.listCreators);
router.post("/:creatorId/view", MarketplaceController.viewCreatorProfile);
router.get("/:creatorId/contact", MarketplaceController.getCreatorContact);

export default router;
