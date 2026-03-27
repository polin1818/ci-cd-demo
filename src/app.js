import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import helloRoutes from "./routes/hello.js";
import statusRoutes from "./routes/status.js";
import taskRoutes from "./routes/tasks.js";
import authRoutes from "./routes/auth.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Connexion DB seulement hors tests
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

app.use(express.json());

// 1️⃣ Routes publiques
app.use("/", helloRoutes);
app.use("/", statusRoutes);
app.use("/api/auth", authRoutes);

// 2️⃣ Routes protégées
app.use("/", taskRoutes);
app.use("/notifications", notificationRoutes);

// 🔥 Lancer serveur seulement hors tests
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;