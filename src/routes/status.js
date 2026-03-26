// src/routes/status.js
import express from "express";

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString()
  });
});

export default router; // <- très important