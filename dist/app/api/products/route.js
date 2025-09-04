"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
let PRODUCTS = [
    { id: "p1", name: "MacBook Air", price: 129900, currency: "USD" },
    { id: "p2", name: "iPhone 15", price: 99900, currency: "USD" },
];
async function GET() {
    return server_1.NextResponse.json(PRODUCTS, { status: 200 });
}
async function POST(req) {
    const body = await req.json().catch(() => ({}));
    if (!body?.name || typeof body.price !== "number") {
        return server_1.NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const id = `p${Date.now()}`;
    const item = { id, name: body.name, price: body.price, currency: body.currency ?? "USD" };
    PRODUCTS = [item, ...PRODUCTS];
    return server_1.NextResponse.json(item, { status: 201 });
}
