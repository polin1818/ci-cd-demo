import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import connectDB from "./config/db.js";

// Importations des routes
import helloRoutes from "./routes/hello.js";
import statusRoutes from "./routes/status.js";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js"; // 👈 Nouvelle route ajoutée

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🛑 MIDDLEWARES DE SÉCURITÉ ET CONFIGURATION ---

// Activation du CORS (Indispensable pour Render + Localhost)
app.use(cors()); 

// Lecture du JSON (Indispensable pour req.body)
app.use(express.json());

// 🔥 Connexion DB seulement hors tests
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// --- 🛣️ ROUTES ---

// 1️⃣ Routes publiques (Authentification)
app.use("/", helloRoutes);
app.use("/", statusRoutes);
app.use("/api/auth", authRoutes);

// 2️⃣ Routes utilisateur (Profil, mot de passe)
app.use("/api/users", userRoutes); // 👈 Branchement du profil

// 3️⃣ Routes métier (Tâches et Notifications)
app.use("/", taskRoutes);
app.use("/notifications", notificationRoutes);

// 🔥 Lancer serveur seulement hors tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Profil activée sur /api/users`);
  });
}

export default app;