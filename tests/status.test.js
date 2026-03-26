import request from "supertest";
import app from "../src/app.js";

describe("Test /status endpoint", () => {
  it("should return status OK and time", async () => {
    const res = await request(app).get("/status");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body.time).toBeDefined();
  });
});