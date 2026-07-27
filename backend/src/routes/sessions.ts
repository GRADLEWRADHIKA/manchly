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

// Expert Availability (Creator)
router.post("/availability", jwtAuth, SessionController.setAvailability);
router.post("/availability/slot", jwtAuth, SessionController.addAvailabilitySlot);
router.get("/availability/me", jwtAuth, SessionController.getMyAvailability);
router.delete("/availability/:slot_id", jwtAuth, SessionController.removeAvailabilitySlot);

// Expert Availability (Public - for booking flow)
router.get("/availability/:expert_id", jwtAuth, SessionController.getExpertAvailability);

// Expert Listing (Public)
router.get("/experts", jwtAuth, SessionController.listExperts);
router.get("/experts/:expert_id", jwtAuth, SessionController.getExpertDetail);
router.get("/experts/:expert_id/booked-slots", jwtAuth, SessionController.getBookedSlots);

// Session Products (Creator)
router.post("/products", jwtAuth, SessionController.createProduct);
router.get("/products/my", jwtAuth, SessionController.getMyProducts);
router.patch("/products/:product_id", jwtAuth, SessionController.updateProduct);
router.delete("/products/:product_id", jwtAuth, SessionController.deleteProduct);

// Session Products (User)
router.get("/products/creator/:creator_id", jwtAuth, SessionController.getCreatorProducts);
router.post("/book", jwtAuth, SessionController.bookSession);
router.post("/verify-payment", jwtAuth, SessionController.verifySessionPayment);
router.post("/rate", jwtAuth, SessionController.rateSession);

export default router;
