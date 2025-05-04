import request from "supertest";
import app from "../server.js"; // Import app from server.js

describe("Signup and Verification Flow", () => {
  let verificationToken;
  let userId;

  it("should signup a user and return verification token", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "dongho",
        email: "ekstrah.dongho@gmail.com",
        password: "strongpassword"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty("verificationToken");

    // Store token and ID for next steps
    verificationToken = res.body.user.verificationToken;
    userId = res.body.user._id;
  });

  it("should verify the user with the token", async () => {
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({
        userId,
        token: verificationToken
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Email verified successfully");
  });
});
