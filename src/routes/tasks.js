import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/auth.js"; // 🔐 Importe ton bouclier

const router = express.Router();

// Option A : Appliquer la protection à TOUTES les routes de ce fichier d'un coup
router.use(verifyToken); 

// On garde /tasks ici car dans app.js tu as mis app.use("/", taskRoutes)
router.get("/tasks", getTasks);
router.get("/tasks/:id", getTaskById);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);

export default router;