#!/usr/bin/env node
// tools/start-issue.js
// Usage: node tools/start-issue.js MEL-123 "Add /api/categories" [extra args...]

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const issueKey = process.argv[2];
const issueTitle = (process.argv[3] || "").trim();
if (!issueKey) {
  console.error("Usage: node tools/start-issue.js <ISSUE_KEY> \"<ISSUE_TITLE>\"");
  process.exit(2);
}

// slug branch
const slug = issueTitle
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "") || "work";

const branch = `${issueKey.toLowerCase()}-${slug}`; // mel-123-add-api-categories

function safeExec(cmd) {
  try {
    execSync(cmd, { stdio: "inherit" });
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
    process.exit(2);
  }
}

// 1) checkout branch
safeExec(`git checkout -b ${branch}`);

// 2) tạo TASK.md
const taskPath = path.join(process.cwd(), "TASK.md");
const taskContent = `# ${issueKey} ${issueTitle}
- [ ] Implement route /api/categories
- [ ] Add tests
- [ ] Update docs/OPENAPI.md
- [ ] Run CI locally: npm test
`;
fs.writeFileSync(taskPath, taskContent, "utf8");

// 3) stub route nếu chưa tồn tại (Express)
const routePath = path.join(process.cwd(), "src", "routes", "categories.ts");
if (!fs.existsSync(routePath)) {
  fs.mkdirSync(path.dirname(routePath), { recursive: true });
  fs.writeFileSync(routePath,
`import { Router } from "express";
const router = Router();
router.get("/api/categories", async (req, res) => {
  // TODO: implement DB query
  res.json({ content: [] });
});
export default router;
`, "utf8");
}

// 4) log ra màn hình cho MCP
console.log(`Created branch ${branch}`);
console.log(`Wrote ${path.relative(process.cwd(), taskPath)}`);
if (!fs.existsSync(routePath)) {
  console.log("Route stub not created (file already exists).");
} else {
  console.log(`Wrote ${path.relative(process.cwd(), routePath)}`);
}
