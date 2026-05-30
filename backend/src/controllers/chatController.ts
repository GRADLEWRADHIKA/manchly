import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ConversationType, MessageType } from "@prisma/client";

// Create or get a conversation between two users
export const createConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { participantId, type = "DIRECT" } = req.body;

        if (!participantId) {
            return res.status(400).json({ error: "Participant ID is required" });
        }

        // For direct conversations, check if one already exists
        if (type === "DIRECT") {
            const existingConversation = await prisma.conversations.findFirst({
                where: {
                    type: ConversationType.DIRECT,
                    participants: {
                        every: {
                            user_id: {
                                in: [userId, participantId],
                            },
                        },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profile_image: true,
                                    user_type: true,
                                },
                            },
                        },
                    },
                    messages: {
                        orderBy: { created_at: "desc" },
                        take: 1,
                    },
                },
            });

            if (existingConversation) {
                return res.json(existingConversation);
            }
        }

        // Create new conversation
        const conversation = await prisma.conversations.create({
            data: {
                type: type as ConversationType,
                participants: {
                    create: [
                        { user_id: userId },
                        { user_id: participantId },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profile_image: true,
                                user_type: true,
                            },
                        },
                    },
                },
            },
        });

        res.status(201).json(conversation);
    } catch (error: any) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
};

// Get all conversations for a user
export const getUserConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;

        const conversations = await prisma.conversations.findMany({
            where: {
                participants: {
                    some: {
                        user_id: userId,
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                profile_image: true,
                                user_type: true,
                            },
                        },
                    },
                },
                group: true,
                messages: {
                    orderBy: { created_at: "desc" },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                                profile_image: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                last_message_at: "desc",
            },
        });

        res.json(conversations);
    } catch (error: any) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

// Get messages for a conversation
export const getConversationMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { conversationId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Check if user is a participant
        const participant = await prisma.conversation_participants.findFirst({
            where: {
                conversation_id: conversationId,
                user_id: userId,
            },
        });

        if (!participant) {
            return res.status(403).json({ error: "Not authorized to view this conversation" });
        }

        const messages = await prisma.messages.findMany({
            where: {
                conversation_id: conversationId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_image: true,
                        user_type: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
            take: Number(limit),
            skip: Number(offset),
        });

        res.json(messages.reverse());
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Send a message
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { conversationId, content, type = "TEXT", attachmentUrl } = req.body;

        if (!conversationId || !content) {
            return res.status(400).json({ error: "Conversation ID and content are required" });
        }

        // Check if user is a participant
        const participant = await prisma.conversation_participants.findFirst({
            where: {
                conversation_id: conversationId,
                user_id: userId,
            },
        });

        if (!participant) {
            return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
        }

        // Create message
        const message = await prisma.messages.create({
            data: {
                conversation_id: conversationId,
                sender_id: userId,
                content,
                type: type as MessageType,
                attachment_url: attachmentUrl,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_image: true,
                        user_type: true,
                    },
                },
            },
        });

        // Update conversation's last_message_at
        await prisma.conversations.update({
            where: { id: conversationId },
            data: { last_message_at: new Date() },
        });

        res.status(201).json(message);
    } catch (error: any) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};

// Mark messages as read
export const markMessagesAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { conversationId } = req.body;

        if (!conversationId) {
            return res.status(400).json({ error: "Conversation ID is required" });
        }

        // Update last_read_at for the participant
        await prisma.conversation_participants.updateMany({
            where: {
                conversation_id: conversationId,
                user_id: userId,
            },
            data: {
                last_read_at: new Date(),
            },
        });

        // Mark all messages as read
        await prisma.messages.updateMany({
            where: {
                conversation_id: conversationId,
                sender_id: { not: userId },
                is_read: false,
            },
            data: {
                is_read: true,
            },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({ error: "Failed to mark messages as read" });
    }
};

// Delete a message
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { messageId } = req.params;

        // Check if user is the sender
        const message = await prisma.messages.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (message.sender_id !== userId) {
            return res.status(403).json({ error: "Not authorized to delete this message" });
        }

        await prisma.messages.delete({
            where: { id: messageId },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message" });
    }
};
