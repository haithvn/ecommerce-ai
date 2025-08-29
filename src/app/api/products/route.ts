import { NextResponse } from "next/server";

let PRODUCTS = [
  { id: "p1", name: "MacBook Air", price: 1299_00, currency: "USD" },
  { id: "p2", name: "iPhone 15",   price:  999_00, currency: "USD" },
];

export async function GET() {
  return NextResponse.json(PRODUCTS, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (!body?.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const id = `p${Date.now()}`;
  const item = { id, name: body.name, price: body.price, currency: body.currency ?? "USD" };
  PRODUCTS = [item, ...PRODUCTS];
  return NextResponse.json(item, { status: 201 });
}
