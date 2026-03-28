import express from "express";
import dotenv from "dotenv";
import cors from "cors"; 
import connectDB from "./config/db.js";
import startMailWorker from "./workers/mailWorker.js"; // 👈 Import de l'automate

// Importations des routes
import helloRoutes from "./routes/hello.js";
import statusRoutes from "./routes/status.js";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🛑 MIDDLEWARES DE SÉCURITÉ ET CONFIGURATION ---
app.use(cors()); 
app.use(express.json());

// 🔥 Connexion DB et Lancement des services
if (process.env.NODE_ENV !== "test") {
  connectDB().then(() => {
    console.log("📦 Base de données synchronisée");

    // 🚀 ACTIVATION DE L'AUTOMATE DE MAILS
    // Il va scanner les notifications PENDING chaque minute
    startMailWorker(); 
  });
}

// --- 🛣️ ROUTES ---

// 1️⃣ Routes publiques (Authentification)
app.use("/", helloRoutes);
app.use("/", statusRoutes);
app.use("/api/auth", authRoutes);

// 2️⃣ Routes utilisateur (Profil, mot de passe)
app.use("/api/users", userRoutes); 

// 3️⃣ Routes métier (Tâches et Notifications)
app.use("/", taskRoutes);
app.use("/notifications", notificationRoutes);

// 🔥 Lancer serveur seulement hors tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Profil activée sur /api/users`);
    console.log(`📧 Système de notifications par mail : ACTIF`);
  });
}

export default app;