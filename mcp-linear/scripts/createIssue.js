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
  const title = process.argv[3];
  const description = process.argv.slice(4).join(' ');
  if (!teamKey || !title) {
    console.error('Usage: node mcp-linear/scripts/createIssue.js <TEAM_KEY> <TITLE> [DESCRIPTION...]');
    process.exit(1);
  }

  const qTeam = `
    query($key:String!){
      teams(first:1, filter:{ key:{ eq:$key } }){ nodes{ id key } }
    }`;
  const rTeam = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query: qTeam, variables: { key: teamKey } })
  });
  const jTeam = await rTeam.json();
  if (jTeam.errors) {
    console.error(JSON.stringify(jTeam.errors, null, 2));
    process.exit(1);
  }
  const teamId = jTeam.data?.teams?.nodes?.[0]?.id;
  if (!teamId) {
    console.error(`Team not found for key=${teamKey}`);
    process.exit(1);
  }

  const qCreate = `
    mutation($teamId:String!, $title:String!, $description:String){
      issueCreate(input:{ teamId:$teamId, title:$title, description:$description }){
        success
        issue { id identifier title }
      }
    }`;
  const rCreate = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query: qCreate, variables: { teamId, title, description } })
  });
  const jCreate = await rCreate.json();
  if (jCreate.errors) {
    console.error(JSON.stringify(jCreate.errors, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(jCreate.data.issueCreate, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
