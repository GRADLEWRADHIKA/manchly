import { Router } from "express";
import { SessionController } from "../controllers/sessionController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// Session CRUD
router.post("/", jwtAuth, SessionController.createSession);
router.patch("/:session_id/accept", jwtAuth, SessionController.acceptSession);
router.patch("/:session_id/end", jwtAuth, SessionController.endSession);
router.get("/", jwtAuth, SessionController.getMySessions);
router.get("/stats", jwtAuth, SessionController.getSessionStats);
router.get("/dashboard", jwtAuth, SessionController.getDashboardStats);
router.get("/call/:call_id", jwtAuth, SessionController.getByCallId);

// Expert Profile (Creator)
router.get("/expert/me", jwtAuth, SessionController.getMyExpertProfile);
router.post("/expert/register", jwtAuth, SessionController.registerAsExpert);
router.patch("/expert/update", jwtAuth, SessionController.updateExpertProfile);

// Expert Listing (Public)
router.get("/experts", jwtAuth, SessionController.listExperts);
router.get("/experts/:expert_id", jwtAuth, SessionController.getExpertDetail);

// Session Products (Creator)
router.post("/products", jwtAuth, SessionController.createProduct);
router.get("/products/my", jwtAuth, SessionController.getMyProducts);
router.patch("/products/:product_id", jwtAuth, SessionController.updateProduct);
router.delete("/products/:product_id", jwtAuth, SessionController.deleteProduct);

// Session Products (User)
router.get("/products/creator/:creator_id", jwtAuth, SessionController.getCreatorProducts);
router.post("/book", jwtAuth, SessionController.bookSession);

export default router;
