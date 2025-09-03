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

  const identifier = process.argv[2];
  if (!identifier) {
    console.error('Usage: node mcp-linear/scripts/getIssue.js <IDENTIFIER>');
    process.exit(1);
  }

  const [teamKey, numStr] = identifier.split('-');
  const number = Number(numStr);
  if (!teamKey || !number) {
    console.error(`Invalid identifier format: ${identifier}. Expected TEAM-123`);
    process.exit(1);
  }

  const query = `
    query($key:String!, $number:Float!){
      issues(
        filter:{ team:{ key:{ eq:$key } }, number:{ eq:$number } },
        first:1
      ){
        nodes{ id identifier title description state{ name } }
      }
    }`;
  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query, variables: { key: teamKey, number } })
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }
  const issue = json.data?.issues?.nodes?.[0] ?? null;
  console.log(JSON.stringify(issue, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
