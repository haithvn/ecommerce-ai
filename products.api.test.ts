import request from "supertest";
import { NextRequest } from "next/server";
import { GET as GET_PRODUCTS, POST as POST_PRODUCTS } from "@/app/api/products/route";

function wrap(handler: any, reqInit?: RequestInit & { url?: string }) {
  const url = reqInit?.url ?? "http://localhost/api/products";
  const r = new NextRequest(url, reqInit);
  return handler(r);
}

describe("Products API", () => {
  it("GET /api/products returns list", async () => {
    const res = await wrap(GET_PRODUCTS);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST /api/products creates product", async () => {
    const res = await wrap(POST_PRODUCTS, {
      method: "POST",
      body: JSON.stringify({ name: "Test", price: 12345 }),
      headers: { "Content-Type": "application/json" }
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("Test");
  });
});
