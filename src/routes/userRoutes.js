import express from "express";
import { getProfile, updateProfile, updatePassword } from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Route : GET /api/users/profile
router.get("/profile", verifyToken, getProfile);

// Route : PUT /api/users/profile (Nom, Email)
router.put("/profile", verifyToken, updateProfile);

// Route : PUT /api/users/profile/password
router.put("/profile/password", verifyToken, updatePassword);

export default router;