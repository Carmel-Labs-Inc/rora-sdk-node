#!/usr/bin/env node
/**
 * Rora CLI - Outside-in monitoring for AI agents
 *
 * Usage:
 *   npx @rora-ai/rora --help
 *   npx @rora-ai/rora list
 *   npx @rora-ai/rora status <agent-id>
 */

import { RoraClient } from './client';
import { RoraError } from './errors';

const VERSION = '0.1.0';

function getApiKey(): string {
  const key = process.env.RORA_API_KEY;
  if (!key) {
    console.error('Error: RORA_API_KEY environment variable is required');
    process.exit(1);
  }
  return key;
}

function printHelp(): void {
  console.log(`
Rora CLI - Outside-in monitoring for AI agents

Usage:
  rora <command> [options]

Commands:
  list                    List all registered agents
  status <agent-id>       Get agent status
  run <agent-id>          Run one-off validation probe
  register                Register a new agent
  delete <agent-id>       Delete an agent

Options:
  --help, -h              Show this help message
  --version, -v           Show version

Environment:
  RORA_API_KEY            Your Rora/Fabric API key (required)
  RORA_BASE_URL           API base URL (optional)

Examples:
  rora list
  rora status abc123
  rora run abc123 --prompt "Hello!"
  rora register --name "My Agent" --endpoint "https://api.example.com/chat"
  rora delete abc123

Links:
  Homepage:  https://carmel.so/rora
  Dashboard: https://rora.carmel.so
`);
}

async function cmdList(): Promise<void> {
  const client = new RoraClient({ apiKey: getApiKey() });
  const agents = await client.listAgents();

  console.log('ID'.padEnd(40) + 'Name'.padEnd(30) + 'Status'.padEnd(10) + 'Last Status');
  console.log('-'.repeat(90));

  for (const agent of agents) {
    const id = agent.id.padEnd(40);
    const name = (agent.name || 'Unnamed').substring(0, 28).padEnd(30);
    const status = (agent.status || 'unknown').padEnd(10);
    const lastVerdict = agent.last_status || 'UNKNOWN';
    console.log(`${id}${name}${status}${lastVerdict}`);
  }
}

async function cmdStatus(agentId: string): Promise<void> {
  const client = new RoraClient({ apiKey: getApiKey() });
  const status = await client.status(agentId);

  console.log(`Agent: ${agentId}`);
  console.log(`Verdict: ${status.verdict}`);
  console.log(`Uptime (24h): ${status.uptime_24h || 0}%`);
  console.log(`Latency P95: ${status.latency_p95 ? `${status.latency_p95} ms` : 'N/A'}`);
  console.log(`Pass Rate: ${status.pass_rate != null ? `${(status.pass_rate * 100).toFixed(1)}%` : 'N/A'}`);
  if (status.last_checked) {
    console.log(`Last Checked: ${status.last_checked}`);
  }
}

async function cmdRun(agentId: string, prompt?: string): Promise<void> {
  const client = new RoraClient({ apiKey: getApiKey() });
  const agent = await client.getAgent(agentId);
  const result = await client.run({
    endpoint: agent.endpoint_url,
    prompts: prompt ? [prompt] : ['Hello, what can you help me with?'],
  });

  console.log(`Run ID: ${result.decision_id}`);
  console.log(`Verdict: ${result.verdict}`);
  console.log(`Latency P95: ${result.latency_p95 || 'N/A'} ms`);
  console.log(`Pass Rate: ${result.pass_rate != null ? `${(result.pass_rate * 100).toFixed(1)}%` : 'N/A'}`);
}

async function cmdRegister(name: string, endpoint: string): Promise<void> {
  const client = new RoraClient({ apiKey: getApiKey() });
  const result = await client.register({ name, endpoint });

  console.log(`Agent registered successfully!`);
  console.log(`Agent ID: ${result.id}`);
}

async function cmdDelete(agentId: string): Promise<void> {
  const client = new RoraClient({ apiKey: getApiKey() });
  await client.deleteAgent(agentId);
  console.log(`Agent ${agentId} deleted successfully`);
}

function parseArgs(args: string[]): { command: string; positional: string[]; flags: Record<string, string> } {
  const command = args[0] || 'help';
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      flags[key] = value || args[++i] || 'true';
    } else if (arg.startsWith('-')) {
      flags[arg.substring(1)] = args[++i] || 'true';
    } else {
      positional.push(arg);
    }
  }

  return { command, positional, flags };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`rora ${VERSION}`);
    return;
  }

  const { command, positional, flags } = parseArgs(args);

  try {
    switch (command) {
      case 'list':
        await cmdList();
        break;

      case 'status':
        if (!positional[0]) {
          console.error('Error: agent-id is required');
          console.error('Usage: rora status <agent-id>');
          process.exit(1);
        }
        await cmdStatus(positional[0]);
        break;

      case 'run':
        if (!positional[0]) {
          console.error('Error: agent-id is required');
          console.error('Usage: rora run <agent-id> [--prompt "..."]');
          process.exit(1);
        }
        await cmdRun(positional[0], flags.prompt);
        break;

      case 'register':
        if (!flags.name || !flags.endpoint) {
          console.error('Error: --name and --endpoint are required');
          console.error('Usage: rora register --name "My Agent" --endpoint "https://..."');
          process.exit(1);
        }
        await cmdRegister(flags.name, flags.endpoint);
        break;

      case 'delete':
        if (!positional[0]) {
          console.error('Error: agent-id is required');
          console.error('Usage: rora delete <agent-id>');
          process.exit(1);
        }
        await cmdDelete(positional[0]);
        break;

      case 'help':
        printHelp();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "rora --help" for usage');
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof RoraError) {
      console.error(`Error: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred');
    }
    process.exit(1);
  }
}

main();
