import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getStatus // Optionnel : pour vérifier la santé de l'API
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// --- PROTECTION GLOBALE ---
// Toutes les routes définies après cette ligne nécessitent un token valide 🔐
router.use(verifyToken); 

// --- ROUTES STANDARDS (CRUD) ---
router.get("/tasks", getTasks);           // Récupère les missions (avec filtres temps/priorité)
router.get("/tasks/:id", getTaskById);    // Détails d'une mission spécifique
router.post("/tasks", createTask);         // Création avec programmation auto des alertes
router.put("/tasks/:id", updateTask);      // Mise à jour (recalcule les notifications si les dates changent)
router.delete("/tasks/:id", deleteTask);   // Suppression + Nettoyage des alertes liées

// --- ROUTE DE SANTÉ SYSTÈME ---
router.get("/status", getStatus);

export default router;