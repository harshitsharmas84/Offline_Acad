/**
 * Production Smoke Tests
 * Run against a deployed URL to verify core functionality
 */

const DEPLOY_URL = process.env.DEPLOY_URL || "http://localhost:3000";

describe("Production Smoke Tests", () => {
    it("should respond with 200 OK on the health endpoint", async () => {
        const res = await fetch(`${DEPLOY_URL}/api/health`);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.status).toBe("ok");
    });

    it("should load the login page correctly", async () => {
        const res = await fetch(`${DEPLOY_URL}/login`);
        expect(res.status).toBe(200);
    });

    it("should load the signup page correctly", async () => {
        const res = await fetch(`${DEPLOY_URL}/signup`);
        expect(res.status).toBe(200);
    });
});
