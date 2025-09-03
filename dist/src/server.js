"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const categories_1 = __importDefault(require("./routes/categories"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(categories_1.default);
// Chỉ listen khi chạy trực tiếp (npm run dev:api / start:api)
if (require.main === module) {
    const port = process.env.PORT || 4000;
    app.listen(port, () => console.log(`API listening on :${port}`));
}
exports.default = app;
