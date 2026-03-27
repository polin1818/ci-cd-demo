import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // 1. Importation du package
import connectDB from "./config/db.js";

import helloRoutes from "./routes/hello.js";
import statusRoutes from "./routes/status.js";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 🛑 MIDDLEWARES DE SÉCURITÉ ET CONFIGURATION ---

// 2. Activation du CORS (Indispensable pour Render + Localhost)
app.use(cors()); 

// 3. Lecture du JSON (Indispensable pour req.body)
app.use(express.json());

// 🔥 Connexion DB seulement hors tests
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// --- 🛣️ ROUTES ---

// 1️⃣ Routes publiques (Accessibles par tous)
app.use("/", helloRoutes);
app.use("/", statusRoutes);
app.use("/api/auth", authRoutes);

// 2️⃣ Routes protégées (Gérées par tes contrôleurs/middlewares internes)
app.use("/", taskRoutes);
app.use("/notifications", notificationRoutes);

// 🔥 Lancer serveur seulement hors tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 CORS activé pour toutes les origines`);
  });
}

export default app;