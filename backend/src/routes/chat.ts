import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
    createConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    markMessagesAsRead,
    deleteMessage,
} from "../controllers/chatController";

const router = Router();

// All chat routes require authentication
// Use jwtAuth (matches the rest of the app's token system; the Supabase-based
// `authenticate` middleware doesn't accept tokens issued by /auth/verify-otp).
router.use(jwtAuth);

// Conversation routes
router.post("/conversations", createConversation);
router.get("/conversations", getUserConversations);
router.get("/conversations/:conversationId/messages", getConversationMessages);

// Message routes
router.post("/messages", sendMessage);
router.put("/messages/read", markMessagesAsRead);
router.delete("/messages/:messageId", deleteMessage);

export default router;
