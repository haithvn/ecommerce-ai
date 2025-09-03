import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ====== Linear GraphQL helper ======
const LINEAR_API = "https://api.linear.app/graphql";
const token = process.env.LINEAR_API_KEY!;
async function gql(query: string, variables?: any) {
  const r = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
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
    description: "Get issue by identifier",
    inputSchema: { identifier: z.string() }       // <-- shape
  },
  async ({ identifier }) => {
    const q = `
      query($id:String!){
        issue(identifier:$id){
          id identifier title description state{ name }
        }
      }`;
    const data = await gql(q, { id: identifier });
    return { content: [{ type: "text", text: JSON.stringify(data.issue, null, 2) }] };
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
    const q1 = `query($key:String!){ team(key:$key){ id name key } }`;
    const d1 = await gql(q1, { key: teamKey });
    if (!d1.team?.id) throw new Error(`Team not found for key=${teamKey}`);
    const teamId = d1.team.id;

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
    const q1 = `query($id:String!){ issue(identifier:$id){ id } }`;
    const d1 = await gql(q1, { id: identifier });
    const issueId = d1.issue?.id;
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

const transport = new StdioServerTransport();
await server.connect(transport);
console.log("[linear-mcp] started on stdio");
