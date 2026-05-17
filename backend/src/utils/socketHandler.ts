import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";
import { MessageType } from "@prisma/client";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userType?: string;
}

export const initializeSocketIO = (httpServer: HTTPServer | HTTPSServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Configure this based on your frontend URL
            methods: ["GET", "POST"],
        },
    });

    // Authentication middleware for Socket.io
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;
            socket.userId = decoded.userId;
            socket.userType = decoded.userType;

            next();
        } catch (error) {
            next(new Error("Invalid authentication token"));
        }
    });

    // Connection handler
    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join conversation rooms
        socket.on("join_conversation", async (conversationId: string) => {
            try {
                // Verify user is a participant
                const participant = await prisma.conversation_participants.findFirst({
                    where: {
                        conversation_id: conversationId,
                        user_id: socket.userId!,
                    },
                });

                if (participant) {
                    socket.join(conversationId);
                    console.log(`User ${socket.userId} joined conversation ${conversationId}`);
                } else {
                    socket.emit("error", { message: "Not authorized to join this conversation" });
                }
            } catch (error) {
                console.error("Error joining conversation:", error);
                socket.emit("error", { message: "Failed to join conversation" });
            }
        });

        // Leave conversation room
        socket.on("leave_conversation", (conversationId: string) => {
            socket.leave(conversationId);
            console.log(`User ${socket.userId} left conversation ${conversationId}`);
        });

        // Send message
        socket.on("send_message", async (data: {
            conversationId: string;
            content: string;
            type?: string;
            attachmentUrl?: string;
        }) => {
            try {
                // Verify user is a participant
                const participant = await prisma.conversation_participants.findFirst({
                    where: {
                        conversation_id: data.conversationId,
                        user_id: socket.userId!,
                    },
                });

                if (!participant) {
                    return socket.emit("error", { message: "Not authorized to send messages in this conversation" });
                }

                // Create message
                const message = await prisma.messages.create({
                    data: {
                        conversation_id: data.conversationId,
                        sender_id: socket.userId!,
                        content: data.content,
                        type: (data.type as MessageType) || MessageType.TEXT,
                        attachment_url: data.attachmentUrl,
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
                    where: { id: data.conversationId },
                    data: { last_message_at: new Date() },
                });

                // Broadcast message to all participants in the conversation
                io.to(data.conversationId).emit("new_message", message);
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        // Typing indicator
        socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
            socket.to(data.conversationId).emit("user_typing", {
                userId: socket.userId,
                conversationId: data.conversationId,
                isTyping: data.isTyping,
            });
        });

        // Message read receipt
        socket.on("message_read", async (data: { conversationId: string }) => {
            try {
                // Update last_read_at for the participant
                await prisma.conversation_participants.updateMany({
                    where: {
                        conversation_id: data.conversationId,
                        user_id: socket.userId!,
                    },
                    data: {
                        last_read_at: new Date(),
                    },
                });

                // Mark all messages as read
                await prisma.messages.updateMany({
                    where: {
                        conversation_id: data.conversationId,
                        sender_id: { not: socket.userId! },
                        is_read: false,
                    },
                    data: {
                        is_read: true,
                    },
                });

                // Notify other participants
                socket.to(data.conversationId).emit("messages_read", {
                    userId: socket.userId,
                    conversationId: data.conversationId,
                });
            } catch (error) {
                console.error("Error marking messages as read:", error);
                socket.emit("error", { message: "Failed to mark messages as read" });
            }
        });

        // ============ CALL / SESSION EVENTS ============

        // Join personal room for receiving calls
        socket.join(`user_${socket.userId}`);

        // Expert calls a user (ring)
        socket.on("call_user", async (data: {
            receiverId: string;
            callId: string;
            sessionId: string;
            mode: string;
        }) => {
            try {
                // Get caller info
                const caller = await prisma.users.findUnique({
                    where: { id: socket.userId! },
                    select: { id: true, name: true, profile_image: true },
                });

                // Send ring to the receiver
                io.to(`user_${data.receiverId}`).emit("incoming_call", {
                    callId: data.callId,
                    sessionId: data.sessionId,
                    mode: data.mode,
                    caller,
                });

                console.log(`Call: ${socket.userId} -> ${data.receiverId} (${data.mode})`);
            } catch (error) {
                console.error("Error in call_user:", error);
                socket.emit("error", { message: "Failed to initiate call" });
            }
        });

        // User accepts the call
        socket.on("call_accepted", (data: { callId: string; callerId: string }) => {
            io.to(`user_${data.callerId}`).emit("call_accepted", {
                callId: data.callId,
                acceptedBy: socket.userId,
            });
        });

        // User declines the call
        socket.on("call_declined", (data: { callId: string; callerId: string }) => {
            io.to(`user_${data.callerId}`).emit("call_declined", {
                callId: data.callId,
                declinedBy: socket.userId,
            });
        });

        // Call ended
        socket.on("call_ended", (data: { callId: string; otherUserId: string }) => {
            io.to(`user_${data.otherUserId}`).emit("call_ended", {
                callId: data.callId,
                endedBy: socket.userId,
            });
        });

        // Expert availability toggle
        socket.on("expert_availability_changed", (data: { is_available: boolean; expert_id: string }) => {
            // Broadcast to all connected users
            socket.broadcast.emit("expert_availability_updated", {
                expert_id: data.expert_id,
                user_id: socket.userId,
                is_available: data.is_available,
            });
            console.log(`Expert ${socket.userId} availability: ${data.is_available}`);
        });

        // User online status
        socket.on("user_online", () => {
            socket.broadcast.emit("user_status", {
                userId: socket.userId,
                status: "online",
            });
        });

        // Disconnection handler
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.userId}`);
            socket.broadcast.emit("user_status", {
                userId: socket.userId,
                status: "offline",
            });
        });
    });

    return io;
};
