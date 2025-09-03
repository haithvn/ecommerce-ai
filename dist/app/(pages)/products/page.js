"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProductsPage;
const react_1 = require("react");
function ProductsPage() {
    const [items, setItems] = (0, react_1.useState)([]);
    const [name, setName] = (0, react_1.useState)("");
    const [price, setPrice] = (0, react_1.useState)(0);
    (0, react_1.useEffect)(() => {
        fetch("/api/products").then(r => r.json()).then(setItems);
    }, []);
    async function addProduct() {
        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, price }),
        });
        if (res.ok) {
            const created = await res.json();
            setItems(v => [created, ...v]);
            setName("");
            setPrice(0);
        }
        else {
            alert("Payload không hợp lệ");
        }
    }
    return (<main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">🛒 Products</h1>
      <div className="flex gap-2 mb-4">
        <input className="border rounded px-3 py-2 flex-1" placeholder="Product name" value={name} onChange={e => setName(e.target.value)}/>
        <input className="border rounded px-3 py-2 w-40" type="number" placeholder="Price (cents)" value={price} onChange={e => setPrice(Number(e.target.value))}/>
        <button className="bg-blue-600 text-white px-4 rounded" onClick={addProduct}>Add</button>
      </div>

      <ul className="space-y-2">
        {items.map(p => (<li key={p.id} className="border rounded p-3 flex justify-between">
            <span>{p.name}</span>
            <span>{(p.price / 100).toFixed(2)} {p.currency}</span>
          </li>))}
      </ul>
    </main>);
}
