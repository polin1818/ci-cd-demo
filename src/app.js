import express from "express";
import helloRoutes from "./routes/hello.js";
import statusRoutes from "./routes/status.js"; // <- nouvelle route

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", helloRoutes);
app.use("/", statusRoutes); // <- ajout de la route

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;