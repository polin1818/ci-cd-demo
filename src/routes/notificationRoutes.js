import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Toutes les routes de notifications nécessitent d'être connecté
router.get("/", verifyToken, getNotifications);
router.put("/read", verifyToken, markAsRead);

export default router;