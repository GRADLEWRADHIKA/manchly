import { Router } from "express";
import { MarketplaceController } from "../controllers/marketplaceController";
import { jwtAuth } from "../middleware/jwtAuth";
import { requireCreatorMarketplaceAccess } from "../middleware/creatorMarketplaceAccess";

const router = Router();

router.use(jwtAuth, requireCreatorMarketplaceAccess);

/**
 * @route   GET /marketplace/creators
 * @desc    List/search creators for Brand/Agency users
 * @access  Protected (Brand/Agency)
 */
router.get("/creators", MarketplaceController.listCreators);

/**
 * @route   POST /marketplace/creators/:creatorId/view
 * @desc    Open creator inspector with freemium paywall
 * @access  Protected (Brand/Agency)
 */
router.post("/creators/:creatorId/view", MarketplaceController.viewCreatorProfile);

/**
 * @route   GET /marketplace/creators/:creatorId/contact
 * @desc    Get creator contact details with follower-based lock
 * @access  Protected (Brand/Agency)
 */
router.get("/creators/:creatorId/contact", MarketplaceController.getCreatorContact);

export default router;
