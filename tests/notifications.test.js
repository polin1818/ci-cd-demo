process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

import User from "../src/models/User.js";
import Task from "../src/models/Task.js";
import Notification from "../src/models/Notification.js";

// 1. SIMULATION DU MAILER (Mock)
// On intercepte l'appel pour ne pas envoyer de vrais mails pendant les tests
jest.mock("../src/utils/mailer.js", () => ({
  sendTaskEmail: jest.fn(() => Promise.resolve(true))
}));

// 2. AUGMENTATION DU TIMEOUT
// On donne plus de marge (15s) pour les opérations DB et auth
jest.setTimeout(15000);

describe("Notifications API", () => {
  let token;

  beforeAll(async () => {
    await connectDB();
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
    // 🔥 On s'assure que tout est bien fermé avant de quitter
    await mongoose.connection.close();
  });

  it("Devrait générer des notifications lors de la création d'une tâche", async () => {
    // 1. Créer une tâche (Dates ajoutées pour validation)
    const resCreate = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ 
        title: "Tâche pour test notif",
        startDate: new Date().toISOString(), // Démarrage immédiat
        endDate: new Date(Date.now() + 3600000).toISOString(), // +1h
        priority: "moyenne",
        category: "Système"
      });

    expect(resCreate.statusCode).toBe(201);

    // 2. Vérifier les notifications
    const res = await request(app)
      .get("/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    
    // On vérifie qu'on a bien reçu les notifications attendues
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    expect(res.body.notifications.some(n => n.type === "TASK_CREATED")).toBe(true);
  });

  it("Devrait marquer toutes les notifications comme lues", async () => {
    const res = await request(app)
      .put("/notifications/read")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("marquées comme lues");

    // Vérification finale
    const checkRes = await request(app)
      .get("/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(checkRes.body.unreadCount).toBe(0);
  });
});