import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ConversationType } from "@prisma/client";

// JWT payload only carries { userId, email } so we look user_type up on demand
// for the admin-gated endpoints. user_type is a Prisma array (UserType[]).
async function isUserAdmin(userId: string | undefined): Promise<boolean> {
    if (!userId) return false;
    const u = await prisma.users.findUnique({
        where: { id: userId },
        select: { user_type: true },
    });
    if (!u?.user_type) return false;
    return (u.user_type as unknown as string[]).includes("ADMIN");
}

// Create a new group (Admin only)
export const createGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup

        // Check if user is admin
        if (!await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only admins can create groups" });
        }

        const { name, description, avatarUrl, memberIds } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        // Create group with conversation and members
        const group = await prisma.groups.create({
            data: {
                name,
                description,
                avatar_url: avatarUrl,
                creator_id: userId,
                conversation: {
                    create: {
                        type: ConversationType.GROUP,
                        name,
                        participants: {
                            create: [
                                { user_id: userId }, // Creator is automatically a participant
                                ...(memberIds || []).map((id: string) => ({ user_id: id })),
                            ],
                        },
                    },
                },
                members: {
                    create: [
                        { user_id: userId, is_admin: true }, // Creator is admin
                        ...(memberIds || []).map((id: string) => ({ user_id: id, is_admin: false })),
                    ],
                },
            },
            include: {
                conversation: {
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
                },
                members: {
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
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_image: true,
                    },
                },
            },
        });

        res.status(201).json(group);
    } catch (error: any) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Failed to create group" });
    }
};

// Get group details
export const getGroupDetails = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { groupId } = req.params;

        // Check if user is a member
        const member = await prisma.group_members.findFirst({
            where: {
                group_id: groupId,
                user_id: userId,
            },
        });

        if (!member) {
            return res.status(403).json({ error: "Not authorized to view this group" });
        }

        const group = await prisma.groups.findUnique({
            where: { id: groupId },
            include: {
                members: {
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
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profile_image: true,
                    },
                },
                conversation: true,
            },
        });

        res.json(group);
    } catch (error: any) {
        console.error("Error fetching group details:", error);
        res.status(500).json({ error: "Failed to fetch group details" });
    }
};

// Update group (Admin only)
export const updateGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup
        const { groupId } = req.params;
        const { name, description, avatarUrl } = req.body;

        // Check if user is admin
        if (!await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only admins can update groups" });
        }

        const group = await prisma.groups.update({
            where: { id: groupId },
            data: {
                name,
                description,
                avatar_url: avatarUrl,
            },
            include: {
                members: {
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

        // Update conversation name if group name changed
        if (name) {
            await prisma.conversations.updateMany({
                where: { group_id: groupId },
                data: { name },
            });
        }

        res.json(group);
    } catch (error: any) {
        console.error("Error updating group:", error);
        res.status(500).json({ error: "Failed to update group" });
    }
};

// Add members to group (Admin only)
export const addGroupMembers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup
        const { groupId } = req.params;
        const { memberIds } = req.body;

        if (!await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only admins can add members" });
        }

        if (!memberIds || memberIds.length === 0) {
            return res.status(400).json({ error: "Member IDs are required" });
        }

        // Get the conversation ID for this group
        const group = await prisma.groups.findUnique({
            where: { id: groupId },
            include: { conversation: true },
        });

        if (!group || !group.conversation) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Add members to group and conversation
        await Promise.all([
            prisma.group_members.createMany({
                data: memberIds.map((id: string) => ({
                    group_id: groupId,
                    user_id: id,
                    is_admin: false,
                })),
                skipDuplicates: true,
            }),
            prisma.conversation_participants.createMany({
                data: memberIds.map((id: string) => ({
                    conversation_id: group.conversation!.id,
                    user_id: id,
                })),
                skipDuplicates: true,
            }),
        ]);

        const updatedGroup = await prisma.groups.findUnique({
            where: { id: groupId },
            include: {
                members: {
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

        res.json(updatedGroup);
    } catch (error: any) {
        console.error("Error adding group members:", error);
        res.status(500).json({ error: "Failed to add group members" });
    }
};

// Remove member from group (Admin only)
export const removeGroupMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup
        const { groupId, memberId } = req.params;

        if (!await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only admins can remove members" });
        }

        // Get the conversation ID for this group
        const group = await prisma.groups.findUnique({
            where: { id: groupId },
            include: { conversation: true },
        });

        if (!group || !group.conversation) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Remove from both group members and conversation participants
        await Promise.all([
            prisma.group_members.deleteMany({
                where: {
                    group_id: groupId,
                    user_id: memberId,
                },
            }),
            prisma.conversation_participants.deleteMany({
                where: {
                    conversation_id: group.conversation.id,
                    user_id: memberId,
                },
            }),
        ]);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error removing group member:", error);
        res.status(500).json({ error: "Failed to remove group member" });
    }
};

// Update member role (Admin only)
export const updateMemberRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup
        const { groupId, memberId } = req.params;
        const { isAdmin } = req.body;

        if (!await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only admins can update member roles" });
        }

        await prisma.group_members.updateMany({
            where: {
                group_id: groupId,
                user_id: memberId,
            },
            data: {
                is_admin: isAdmin,
            },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error updating member role:", error);
        res.status(500).json({ error: "Failed to update member role" });
    }
};

// Leave group
export const leaveGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { groupId } = req.params;

        // Get the conversation ID for this group
        const group = await prisma.groups.findUnique({
            where: { id: groupId },
            include: { conversation: true },
        });

        if (!group || !group.conversation) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Don't allow creator to leave
        if (group.creator_id === userId) {
            return res.status(400).json({ error: "Group creator cannot leave. Delete the group instead." });
        }

        // Remove from both group members and conversation participants
        await Promise.all([
            prisma.group_members.deleteMany({
                where: {
                    group_id: groupId,
                    user_id: userId,
                },
            }),
            prisma.conversation_participants.deleteMany({
                where: {
                    conversation_id: group.conversation.id,
                    user_id: userId,
                },
            }),
        ]);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error leaving group:", error);
        res.status(500).json({ error: "Failed to leave group" });
    }
};

// Delete group (Creator or Admin only)
export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        // userType replaced by isUserAdmin(userId) DB lookup
        const { groupId } = req.params;

        const group = await prisma.groups.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Only creator or admin can delete
        if (group.creator_id !== userId && !await isUserAdmin(userId)) {
            return res.status(403).json({ error: "Only group creator or admin can delete the group" });
        }

        await prisma.groups.delete({
            where: { id: groupId },
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting group:", error);
        res.status(500).json({ error: "Failed to delete group" });
    }
};

// List all groups the current user belongs to.
// Returns each group with member count + the user's role inside it.
export const listMyGroups = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const memberships = await prisma.group_members.findMany({
            where: { user_id: userId },
            include: {
                group: {
                    include: {
                        _count: { select: { members: true } },
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                profile_image: true,
                            },
                        },
                    },
                },
            },
            orderBy: { joined_at: "desc" },
        });

        const groups = memberships.map((m) => ({
            ...m.group,
            member_count: (m.group as any)._count?.members ?? 0,
            is_admin: m.is_admin,
        }));

        res.json({ data: groups });
    } catch (error: any) {
        console.error("Error listing groups:", error);
        res.status(500).json({ error: "Failed to list groups" });
    }
};
