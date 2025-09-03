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

  // Usage: node mcp-linear/scripts/updateIssue.js <IDENTIFIER> [--title "..."] [--description "..."] [--stateId ID]
  const args = process.argv.slice(2);
  const identifier = args[0];
  if (!identifier) {
    console.error('Usage: node mcp-linear/scripts/updateIssue.js <IDENTIFIER> [--title "..."] [--description "..."] [--stateId ID]');
    process.exit(1);
  }

  // Parse flags
  let title = undefined;
  let description = undefined;
  let stateId = undefined;
  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === '--title') {
      title = args[++i];
    } else if (a === '--description') {
      description = args[++i];
    } else if (a === '--stateId') {
      stateId = args[++i];
    }
  }

  const [teamKey, numStr] = identifier.split('-');
  const number = Number(numStr);
  if (!teamKey || !number) {
    console.error(`Invalid identifier format: ${identifier}. Expected TEAM-123`);
    process.exit(1);
  }

  // Find issue ID
  const qFind = `
    query($key:String!, $number:Float!){
      issues(
        filter:{ team:{ key:{ eq:$key } }, number:{ eq:$number } },
        first:1
      ){
        nodes{ id }
      }
    }`;
  const rFind = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query: qFind, variables: { key: teamKey, number } })
  });
  const jFind = await rFind.json();
  if (jFind.errors) {
    console.error(JSON.stringify(jFind.errors, null, 2));
    process.exit(1);
  }
  const issueId = jFind.data?.issues?.nodes?.[0]?.id;
  if (!issueId) {
    console.error(`Issue not found: ${identifier}`);
    process.exit(1);
  }

  const qUpdate = `
    mutation($id:String!, $title:String, $description:String, $stateId:String){
      issueUpdate(id:$id, input:{ title:$title, description:$description, stateId:$stateId }){
        success
      }
    }`;
  const rUpdate = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `${token}`
    },
    body: JSON.stringify({ query: qUpdate, variables: { id: issueId, title, description, stateId } })
  });
  const jUpdate = await rUpdate.json();
  if (jUpdate.errors) {
    console.error(JSON.stringify(jUpdate.errors, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(jUpdate.data.issueUpdate, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


