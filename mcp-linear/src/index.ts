import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { spawn } from "child_process";

// ====== Linear GraphQL helper ======
const LINEAR_API = "https://api.linear.app/graphql";
const token = process.env.LINEAR_API_KEY!;
async function gql(query: string, variables?: any) {
  const r = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `${token}`
    },
    body: JSON.stringify({ query, variables })
  });
  const j = await r.json() as any;
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

// ====== MCP server ======
const server = new McpServer({ name: "linear-mcp", version: "1.0.0" });

// ping test
server.tool("ping", async () => ({ content: [{ type: "text", text: "pong" }] }));

// 1) List teams — KHÔNG cần inputSchema
server.registerTool(
  "linearListTeams",
  { description: "List teams" },
  async () => {
    const q = `query { teams(first:50){ nodes { id name key } } }`;
    const data = await gql(q);
    return { content: [{ type: "text", text: JSON.stringify(data.teams.nodes, null, 2) }] };
  }
);

// 2) List issues by team key
server.registerTool(
  "linearListIssues",
  {
    description: "List issues by team key",
    inputSchema: { teamKey: z.string() }         // <-- shape, NOT z.object()
  },
  async ({ teamKey }) => {
    const q = `
      query($key:String!){
        issues(filter:{team:{key:{eq:$key}}}, first:20){
          nodes{ id identifier title state{ name } }
        }
      }`;
    const data = await gql(q, { key: teamKey });
    return { content: [{ type: "text", text: JSON.stringify(data.issues.nodes, null, 2) }] };
  }
);

// 3) Get issue by identifier
server.registerTool(
  "linearGetIssue",
  {
    description: "Get issue by identifier (e.g. TEAM-123)",
    inputSchema: { identifier: z.string() }
  },
  async ({ identifier }) => {
    const [teamKey, numStr] = identifier.split("-");
    const number = Number(numStr);
    if (!teamKey || !number) {
      throw new Error(`Invalid identifier format: ${identifier}. Expected TEAM-123`);
    }
    const q = `
      query($key:String!, $number:Float!){
        issues(
          filter:{ team:{ key:{ eq:$key } }, number:{ eq:$number } },
          first:1
        ){
          nodes{ id identifier title description state{ name } }
        }
      }`;
    const data = await gql(q, { key: teamKey, number });
    const issue = data.issues?.nodes?.[0] ?? null;
    if (!issue) throw new Error(`Issue not found: ${identifier}`);
    return { content: [{ type: "text", text: JSON.stringify(issue, null, 2) }] };
  }
);

// 4) Create issue by teamKey
server.registerTool(
  "linearCreateIssue",
  {
    description: "Create issue by teamKey",
    inputSchema: {                               // <-- shape
      teamKey: z.string(),
      title: z.string(),
      description: z.string().optional()
    }
  },
  async ({ teamKey, title, description }) => {
    const q1 = `
      query($key:String!){
        teams(first:1, filter:{ key:{ eq:$key } }){
          nodes{ id name key }
        }
      }`;
    const d1 = await gql(q1, { key: teamKey });
    const team = d1.teams?.nodes?.[0];
    if (!team?.id) throw new Error(`Team not found for key=${teamKey}`);
    const teamId = team.id;

    const q2 = `
      mutation($teamId:String!, $title:String!, $description:String){
        issueCreate(input:{ teamId:$teamId, title:$title, description:$description }){
          success issue { id identifier title }
        }
      }`;
    const d2 = await gql(q2, { teamId, title, description });
    return { content: [{ type: "text", text: JSON.stringify(d2.issueCreate, null, 2) }] };
  }
);

// 5) Update issue fields by identifier
server.registerTool(
  "linearUpdateIssue",
  {
    description: "Update issue fields (title/description/stateId) by identifier",
    inputSchema: {                               // <-- shape
      identifier: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      stateId: z.string().optional()
    }
  },
  async ({ identifier, title, description, stateId }) => {
    const [teamKey, numStr] = identifier.split("-");
    const number = Number(numStr);
    if (!teamKey || !number) {
      throw new Error(`Invalid identifier format: ${identifier}. Expected TEAM-123`);
    }
    const q1 = `
      query($key:String!, $number:Float!){
        issues(
          filter:{ team:{ key:{ eq:$key } }, number:{ eq:$number } },
          first:1
        ){
          nodes{ id }
        }
      }`;
    const d1 = await gql(q1, { key: teamKey, number });
    const issueId = d1.issues?.nodes?.[0]?.id;
    if (!issueId) throw new Error(`Issue not found: ${identifier}`);

    const q2 = `
      mutation($id:String!, $title:String, $description:String, $stateId:String){
        issueUpdate(id:$id, input:{ title:$title, description:$description, stateId:$stateId }){
          success
        }
      }`;
    const out = await gql(q2, { id: issueId, title, description, stateId });
    return { content: [{ type: "text", text: JSON.stringify(out.issueUpdate, null, 2) }] };
  }
);

// 6) Start issue: set "In Progress" + chạy script local tạo branch/scaffold
server.registerTool("linearStartIssue", {
  description: "Set issue In Progress and bootstrap local branch/scaffold",
  inputSchema: {
    /** Linear identifier dạng TEAM-123, ví dụ MEL-123 */
    identifier: z.string(),
    /** Có chạy script local hay không (mặc định: true) */
    runLocal: z.boolean().optional(),
    /** Đường dẫn script local (mặc định: tools/start-issue.js) */
    scriptPath: z.string().optional(),
    /** Tham số bổ sung cho script (mặc định: []) */
    extraArgs: z.array(z.string()).optional(),
  }
}, async ({ identifier, runLocal = true, scriptPath = "tools/start-issue.js", extraArgs = [] }) => {
  // Parse identifier: TEAM-123
  const [teamKey, numStr] = String(identifier).split("-");
  const number = Number(numStr);
  if (!teamKey || !number) {
    throw new Error(`Invalid identifier: ${identifier}. Expected TEAM-123`);
  }

  // 1) Lấy issue + team states
  const qIssue = `
    query($key:String!, $number:Float!){
      issues(
        filter:{ team:{ key:{ eq:$key } }, number:{ eq:$number } },
        first:1
      ){
        nodes{
          id
          identifier
          title
          team{ states{ nodes{ id name } } }
        }
      }
    }`;
  const dIssue = await gql(qIssue, { key: teamKey, number });
  const issue = dIssue?.issues?.nodes?.[0];
  if (!issue) throw new Error(`Issue not found: ${identifier}`);

  
  // 2) Tìm state "In Progress" (không bắt buộc có)
const states: Array<{ id: string; name: string }> = issue.team?.states?.nodes ?? [];
const inProg = states.find((s) => /in\s*progress/i.test(s.name));

  // 3) Cập nhật state nếu tìm thấy
  let stateChanged = false;
  if (inProg?.id) {
    const qUpdate = `
      mutation($id:String!, $stateId:String!){
        issueUpdate(id:$id, input:{ stateId:$stateId }){ success }
      }`;
    const upd = await gql(qUpdate, { id: issue.id, stateId: inProg.id });
    stateChanged = !!upd?.issueUpdate?.success;
  }

  // 4) (Tuỳ chọn) Gọi script local để tạo branch + scaffold
  //    Mặc định gọi: node tools/start-issue.js <identifier> "<title>"
  let scriptResult: { code:number|null, stdout:string, stderr:string } | null = null;

  if (runLocal) {
    const cmd = process.platform === "win32" ? "node" : "node";
    const args = [scriptPath, identifier, issue.title, ...extraArgs];

    scriptResult = await new Promise((resolve) => {
      const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
      let out = ""; let err = "";
      child.stdout.on("data", (d) => { out += d.toString(); });
      child.stderr.on("data", (d) => { err += d.toString(); });
      child.on("close", (code) => {
        resolve({ code, stdout: out.trim(), stderr: err.trim() });
      });
    });
  }

  // 5) Trả về kết quả
  const payload = {
    identifier,
    title: issue.title,
    stateChanged,
    ranScript: runLocal,
    scriptPath: runLocal ? scriptPath : undefined,
    script: scriptResult ?? undefined,
  };

  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
});


const transport = new StdioServerTransport();

(async () => {
  await server.connect(transport);
  console.log("[linear-mcp] started on stdio");
})();
