"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
// Mock module src/db.ts TRƯỚC khi import app
jest.mock("../src/db", () => ({
    __esModule: true,
    default: {
        query: jest.fn().mockResolvedValue({
            rows: [
                { id: 1, code: "IP", name: "iPhone" },
                { id: 2, code: "MAC", name: "Makeup" },
            ],
        }),
    },
}));
const server_1 = __importDefault(require("../src/server"));
describe("GET /api/categories", () => {
    it("returns 200 and array", async () => {
        const res = await (0, supertest_1.default)(server_1.default).get("/api/categories");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.content)).toBe(true);
        expect(res.body.content[0]).toHaveProperty("code");
    });
    it("supports search q", async () => {
        const res = await (0, supertest_1.default)(server_1.default).get("/api/categories?q=ip");
        expect(res.status).toBe(200);
    });
});
