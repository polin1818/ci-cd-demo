process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

import User from "../src/models/User.js";
import Task from "../src/models/Task.js";

describe("Cycle Complet API Tasks (Auth + CRUD + Filtres)", () => {
  let token;
  let taskId;

  beforeAll(async () => {
    // 🔥 Connexion DB contrôlée
    await connectDB();

    // Nettoyage
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  afterAll(async () => {
    // 🔥 Fermeture propre
    await mongoose.connection.close();
  });

  // --- 1. AUTHENTIFICATION ---
  
  it("Devrait inscrire un nouvel utilisateur", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        username: "testuser",
        email: "test@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(201);
  });

  it("Devrait connecter l'utilisateur et retourner un token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  // --- 2. CRÉATION ---

  it("Devrait créer une tâche avec succès", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Tâche de Test",
        description: "Apprendre Jest",
        priority: "haute"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Tâche de Test");

    taskId = res.body._id;
  });

  // --- 3. FILTRES ---

  it("Devrait récupérer les tâches avec pagination", async () => {
    const res = await request(app)
      .get("/tasks?priority=haute&page=1&limit=10")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("totalTasks");
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it("Devrait rechercher une tâche", async () => {
    const res = await request(app)
      .get("/tasks?search=Test")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  // --- 4. UPDATE ---

  it("Devrait modifier une tâche", async () => {
    const res = await request(app)
      .put(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "terminé", completed: true });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("terminé");
  });

  // --- 5. SÉCURITÉ ---

  it("Devrait refuser sans token", async () => {
    const res = await request(app).get("/tasks");
    expect(res.statusCode).toBe(401);
  });

  // --- 6. DELETE ---

  it("Devrait supprimer la tâche", async () => {
    const res = await request(app)
      .delete(`/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });
});