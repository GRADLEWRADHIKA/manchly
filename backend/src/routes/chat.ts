import { Router } from "express";
import { authenticate } from "../middleware/auth";
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
router.use(authenticate);

// Conversation routes
router.post("/conversations", createConversation);
router.get("/conversations", getUserConversations);
router.get("/conversations/:conversationId/messages", getConversationMessages);

// Message routes
router.post("/messages", sendMessage);
router.put("/messages/read", markMessagesAsRead);
router.delete("/messages/:messageId", deleteMessage);

export default router;
