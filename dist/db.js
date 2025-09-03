"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/db.ts
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config(); // load .env nếu có
// Ưu tiên dùng DATABASE_URL (chuỗi kết nối), fallback sang từng biến
const { DATABASE_URL, PGHOST = "localhost", PGPORT = "5432", PGUSER = "postgres", PGPASSWORD = "postgres", PGDATABASE = "ecommerce_ai" } = process.env;
const pool = DATABASE_URL
    ? new pg_1.Pool({
        connectionString: DATABASE_URL,
        ssl: false, // bật true nếu cần (prod)
    })
    : new pg_1.Pool({
        host: PGHOST,
        port: Number(PGPORT),
        user: PGUSER,
        password: PGPASSWORD,
        database: PGDATABASE,
    });
exports.default = pool;
