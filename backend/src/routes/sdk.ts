import { Router } from "express";
import { SdkAuthController } from "../controllers/sdkAuthController";

const router = Router();

// Public creator-onboarding endpoints used by the Manchly JS SDK.
router.post("/creator/request-otp", SdkAuthController.requestOtp);
router.post("/creator/verify",      SdkAuthController.verify);

export default router;
