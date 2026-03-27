process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

import User from "../src/models/User.js";
import Task from "../src/models/Task.js";
import Notification from "../src/models/Notification.js";

describe("Notifications API", () => {
  let token;

  beforeAll(async () => {
    // 🔥 Connexion DB contrôlée
    await connectDB();

    // Nettoyage
    await User.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});

    // Création utilisateur
    await request(app)
      .post("/api/auth/register")
      .send({
        username: "notifuser",
        email: "notif@test.com",
        password: "password123"
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: "notif@test.com",
        password: "password123"
      });

    token = loginRes.body.token;
  });

  afterAll(async () => {
    // 🔥 Nettoyage final + fermeture propre
    await mongoose.connection.close();
  });

  it("Devrait générer une notification lors de la création d'une tâche", async () => {
    // 1. Créer une tâche
    await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Tâche pour test notif" });

    // 2. Vérifier notification
    const res = await request(app)
      .get("/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.notifications[0].type).toBe("TASK_CREATED");
  });

  it("Devrait marquer toutes les notifications comme lues", async () => {
    const res = await request(app)
      .put("/notifications/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("marquées comme lues");

    // Vérification
    const checkRes = await request(app)
      .get("/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(checkRes.body.unreadCount).toBe(0);
  });
});