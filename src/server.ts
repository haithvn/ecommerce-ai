import express from "express";
import categoriesRoute from "./routes/categories";

const app = express();
app.use(express.json());
app.use(categoriesRoute);

// Chỉ listen khi chạy trực tiếp (npm run dev:api / start:api)
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => console.log(`API listening on :${port}`));
}

export default app;
