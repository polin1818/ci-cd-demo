import request from "supertest";
import app from "../src/app.js";

describe("Test /hello endpoint", () => {
  it("should return hello message", async () => {
    const res = await request(app).get("/hello");
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Hello CI/CD");
  });
});