import { Router } from "express";
import { TelegramController } from "../controllers/telegramController";

const router = Router();

router.post("/webhook", TelegramController.receiveUpdate);
router.post("/verify", TelegramController.verifyOrder);
router.get("/health", TelegramController.health);
router.get("/channels", TelegramController.listChannels);
router.get("/channels/:id", TelegramController.getChannel);
router.get("/subscriptions", TelegramController.listSubscriptions);

export default router;
