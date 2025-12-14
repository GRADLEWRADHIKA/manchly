import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
    createGroup,
    getGroupDetails,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    leaveGroup,
    deleteGroup,
} from "../controllers/groupController";

const router = Router();

// All group routes require authentication
router.use(authenticate);

// Group routes
router.post("/", createGroup);
router.get("/:groupId", getGroupDetails);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

// Member management routes
router.post("/:groupId/members", addGroupMembers);
router.delete("/:groupId/members/:memberId", removeGroupMember);
router.put("/:groupId/members/:memberId/role", updateMemberRole);
router.post("/:groupId/leave", leaveGroup);

export default router;
