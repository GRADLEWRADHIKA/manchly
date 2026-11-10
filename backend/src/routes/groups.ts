import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import {
    createGroup,
    getGroupDetails,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
    updateMemberRole,
    leaveGroup,
    deleteGroup,
    listMyGroups,
} from "../controllers/groupController";

const router = Router();

// All group routes require authentication.
// Use jwtAuth (matches the rest of the app's token system).
router.use(jwtAuth);

// Group routes
router.get("/", listMyGroups);                 // list groups the current user is a member of
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
