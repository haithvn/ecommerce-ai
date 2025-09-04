import { GET as GET_PRODUCTS, POST as POST_PRODUCTS } from "@/app/api/products/route";

function jsonHeaders() {
  return { "content-type": "application/json" };
}

describe("Next API route /api/products", () => {
  it("GET returns 200 and array", async () => {
    const req = new Request("http://localhost/api/products", { method: "GET" });
    const res = await GET_PRODUCTS(req);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true); // tuỳ theo bạn trả về dạng gì
  });

  it("POST creates product", async () => {
    const body = { name: "Test", price: 12345, currency: "USD" };
    const req = new Request("http://localhost/api/products", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(body),
    });
    const res = await POST_PRODUCTS(req);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data.name).toBe("Test");
  });
});
