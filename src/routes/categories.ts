// src/routes/categories.ts
import { Router } from "express";
import pool from "../db";

const router = Router();

router.get("/api/categories", async (req, res) => {
  const { status = "A", q } = req.query as { status?: string; q?: string };
  try {
    const { rows } = await pool.query(
      `SELECT id, code, name
       FROM category
       WHERE ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL
           OR name ILIKE '%'||$2||'%'
           OR code ILIKE '%'||$2||'%')
       ORDER BY name ASC
       LIMIT 50`,
      [status, q ?? null]
    );
    res.json({ content: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
