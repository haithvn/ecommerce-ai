// src/db.ts
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config(); // load .env nếu có

// Ưu tiên dùng DATABASE_URL (chuỗi kết nối), fallback sang từng biến
const {
  DATABASE_URL,
  PGHOST = "localhost",
  PGPORT = "5432",
  PGUSER = "postgres",
  PGPASSWORD = "postgres",
  PGDATABASE = "ecommerce_ai"
} = process.env;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: false, // bật true nếu cần (prod)
    })
  : new Pool({
      host: PGHOST,
      port: Number(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
    });

export default pool;
