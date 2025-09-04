"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/categories.ts
const express_1 = require("express");
const db_1 = __importDefault(require("../db"));
const router = (0, express_1.Router)();
router.get("/api/categories", async (req, res) => {
    const { status = "A", q } = req.query;
    try {
        const { rows } = await db_1.default.query(`SELECT id, code, name
       FROM category
       WHERE ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL
           OR name ILIKE '%'||$2||'%'
           OR code ILIKE '%'||$2||'%')
       ORDER BY name ASC
       LIMIT 50`, [status, q ?? null]);
        res.json({ content: rows });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;
