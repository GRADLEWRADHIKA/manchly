import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Server as HTTPSServer } from "https";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient";
import { firebaseService } from "../services/FirebaseService";

interface AuthenticatedSocket extends Socket {
    userId?: string;
    userType?: string;
    deviceId?: string;
}

let ioInstance: SocketIOServer | null = null;

export const getIO = (): SocketIOServer | null => ioInstance;

export const emitForceLogout = (userId: string, message = "Your account was signed in on another device. You have been logged out.") => {
    if (ioInstance && userId) {
        ioInstance.to("user_" + userId).emit("force_logout", {
            message,
            code: "DEVICE_REVOKED"
        });
        ioInstance.to("user_" + userId).emit("device_revoked", {
            message,
            code: "DEVICE_REVOKED"
        });
    }
};

export const initializeSocketIO = (httpServer: HTTPServer | HTTPSServer) => {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGINS
                ? process.env.CORS_ORIGINS.split(',')
                : ['https://manchly.com', 'https://server.manchly.com', 'http://localhost:8081'],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    ioInstance = io;

    // Authentication middleware for Socket.io
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

            if (!token) {
                return next(new Error("Authentication token required"));
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                return next(new Error("JWT_SECRET not configured"));
            }
            const decoded = jwt.verify(token, jwtSecret) as any;
            socket.userId = decoded.userId;
            socket.userType = decoded.userType;
            socket.deviceId = decoded.deviceId;

            next();
        } catch (error) {
            next(new Error("Invalid authentication token"));
        }
    });

    // Connection handler
    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.userId}`);
        if (socket.userId) {
            socket.join("user_" + socket.userId);
        }

        // ============ CALL / SESSION EVENTS ============

        // Join personal room for receiving calls
        socket.join(`user_${socket.userId}`);

        // Join a device-specific room so we can force-logout THIS device only
        // when its session is evicted by a login on another device (Feature #2).
        if (socket.deviceId) {
            socket.join(`device_${socket.deviceId}`);
        }

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

                // Send ring to the receiver via socket (works when app is open)
                io.to(`user_${data.receiverId}`).emit("incoming_call", {
                    callId: data.callId,
                    sessionId: data.sessionId,
                    mode: data.mode,
                    caller,
                });

                // Also send FCM push notification (works when app is killed/background)
                const receiver = await prisma.users.findUnique({
                    where: { id: data.receiverId },
                    select: { fcm_token: true },
                });

                if (receiver?.fcm_token) {
                    firebaseService.sendCallNotification(receiver.fcm_token, {
                        callId: data.callId,
                        sessionId: data.sessionId,
                        mode: data.mode,
                        callerName: caller?.name || "Expert",
                        callerImage: caller?.profile_image || "",
                        callerId: caller?.id || socket.userId!,
                    });
                }

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

    ioInstance = io;
    return io;
};
