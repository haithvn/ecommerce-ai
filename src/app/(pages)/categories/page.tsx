// src/app/(pages)/categories/page.tsx

// ✨ Khai báo type ở đầu file
type Category = { id: number; code: string; name: string };
type CategoryResponse = { content: Category[] };

async function fetchCategories(): Promise<CategoryResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return (await res.json()) as CategoryResponse;
}

export default async function Page() {
  const data = await fetchCategories();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Categories</h1>
      <ul className="space-y-2">
        {data.content.map((c: Category) => (  // 👈 dùng Category thay any
          <li key={c.id} className="border rounded p-3 flex justify-between">
            <span>{c.code}</span>
            <span>{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
