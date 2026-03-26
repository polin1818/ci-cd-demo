import express from "express";
import helloRoutes from "./routes/hello.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/", helloRoutes);

// N'écoute pas quand on est en test
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app; // pour tests