process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import mongoose from "mongoose";
import connectDB from "../src/config/db.js";

jest.setTimeout(30000);

describe("User Profile API", () => {
  let token;
  const uniqueId = Date.now();
  const testEmail = `laurence.${uniqueId}@test.com`;
  const testUsername = `usr_${String(uniqueId).slice(-8)}`;

  beforeAll(async () => {
    // ✅ Connexion DB explicite avec log
    console.log("🔌 État DB avant connexion :", mongoose.connection.readyState);
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    console.log("🔌 État DB après connexion :", mongoose.connection.readyState);
    console.log("👤 Username généré :", testUsername, "| Longueur :", testUsername.length);

    // Nettoyage
    await User.deleteMany({ email: testEmail });

    // ✅ Register
    console.log("📤 Tentative de register...");
    let res;
    try {
      res = await request(app)
        .post("/api/auth/register")
        .send({
          username: testUsername,
          name: "Laurence Test",
          email: testEmail,
          password: "password123"
        });
      console.log("📥 Réponse register - status:", res.statusCode, "| body:", JSON.stringify(res.body));
    } catch (err) {
      console.error("💥 ERREUR RÉSEAU lors du register :", err.message);
      return;
    }

    if (res.statusCode !== 201 && res.statusCode !== 200) {
      console.error("❌ ÉCHEC DU REGISTER :", res.body);
      return;
    }

    // ✅ Si register OK mais pas de token → tenter un login
    if (!res.body.token) {
      console.warn("⚠️ Pas de token dans la réponse du register, tentative de login...");
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: testEmail, password: "password123" });
      console.log("📥 Réponse login - status:", loginRes.statusCode, "| body:", JSON.stringify(loginRes.body));
      token = loginRes.body.token;
    } else {
      token = res.body.token;
    }

    console.log("🔑 Token obtenu :", token ? "OUI" : "NON");
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
    await mongoose.connection.close();
  });

  it("devrait récupérer le profil de l'utilisateur connecté", async () => {
    expect(token).toBeDefined();

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  it("devrait modifier le nom de l'utilisateur", async () => {
    expect(token).toBeDefined();

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Laurence Modifié" });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe("Laurence Modifié");
  });

  it("devrait changer le mot de passe avec succès", async () => {
    expect(token).toBeDefined();

    const res = await request(app)
      .put("/api/users/profile/password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        oldPassword: "password123",
        newPassword: "newpassword456"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/mis à jour/i);
  });
});