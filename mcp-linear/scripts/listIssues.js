import fs from 'fs';
import path from 'path';

async function main() {
  const root = process.cwd();
  const mcpPath = path.join(root, '.cursor', 'mcp.json');
  const raw = fs.readFileSync(mcpPath, 'utf-8');
  const cfg = JSON.parse(raw);
  const token = cfg?.mcpServers?.linear?.env?.LINEAR_API_KEY;
  if (!token) {
    console.error('Missing LINEAR_API_KEY in .cursor/mcp.json');
    process.exit(1);
  }

  const teamKey = process.argv[2];
  if (!teamKey) {
    console.error('Usage: node mcp-linear/scripts/listIssues.js <TEAM_KEY>');
    process.exit(1);
  }

  const query = `
    query($key:String!){
      issues(filter:{team:{key:{eq:$key}}}, first:20){
        nodes{ id identifier title state{ name } }
      }
    }`;
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query, variables: { key: teamKey } })
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(json.data.issues.nodes, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
