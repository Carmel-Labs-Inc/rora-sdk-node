# Rora SDK for Node.js

Outside-in monitoring for AI agents. Monitor any HTTP-accessible AI agent from distributed residential endpoints worldwide.

## Installation

```bash
npm install @rora-ai/rora
# or
yarn add @rora-ai/rora
# or
pnpm add @rora-ai/rora
```

## Quick Start

```typescript
import rora from '@rora-ai/rora';

// Initialize with your API key
rora.init({ apiKey: 'fb_live_xxx' });

// Register an agent for continuous monitoring
const agent = await rora.register({
  endpoint: 'https://api.mycompany.com/chat',
  name: 'Support Bot',
  interval_minutes: 60, // Check every hour
});

console.log(`Registered: ${agent.id}`);

// Check current status
const status = await rora.status(agent.id);
console.log(`Verdict: ${status.verdict}`); // UP, DEGRADED, DOWN
console.log(`Uptime: ${status.uptime_24h}%`);
console.log(`Latency: ${status.latency_p95}ms`);
```

## One-Off Validation

Run a quick validation without registering for continuous monitoring:

```typescript
const result = await rora.run({
  endpoint: 'https://api.example.com/chat',
  prompts: ['What is 2+2?', 'Hello!'],
});

console.log(`Verdict: ${result.verdict}`);
console.log(`P95 Latency: ${result.latency_p95}ms`);
console.log(`Pass Rate: ${result.pass_rate}`);
```

## Authentication

For agents requiring authentication:

```typescript
// Bearer token
const agent = await rora.register({
  endpoint: 'https://api.mycompany.com/chat',
  name: 'Private Bot',
  auth: { type: 'bearer', token: 'sk-xxx' },
});

// API key in header
const agent2 = await rora.register({
  endpoint: 'https://api.mycompany.com/chat',
  name: 'API Bot',
  auth: { type: 'api_key', header: 'X-API-Key', value: 'xxx' },
});
```

## Advanced Options

```typescript
const agent = await rora.register({
  endpoint: 'https://api.mycompany.com/chat',
  name: 'Enterprise Bot',

  // Probing configuration
  interval_minutes: 60,      // How often to probe
  max_nodes_per_run: 10,     // Distributed nodes per check
  geos: ['us', 'eu', 'ap'],  // Geographic regions
  timeout_ms: 30000,         // Request timeout

  // Validation options
  eval_type: 'llm_judge',    // 'basic', 'llm_judge', or 'all'
  gold_prompt_profile: 'search_agent', // Specialized prompts
  inject_geo_context: true,  // Add location to prompts

  // Response handling
  streaming: true,           // SSE streaming responses
});
```

## Direct Client Usage

For more control, use the client directly:

```typescript
import { RoraClient } from '@rora-ai/rora';

const client = new RoraClient({
  apiKey: 'fb_live_xxx',
  baseUrl: 'https://api.fabric.carmel.so', // optional
  timeout: 60000, // optional
});

const agents = await client.listAgents();
```

## Types

### Agent

```typescript
interface Agent {
  id: string;
  name: string;
  endpoint_url: string;
  status: 'active' | 'paused' | 'deleted';
  interval_minutes: number;
  last_status?: 'UP' | 'DEGRADED' | 'DOWN';
}
```

### AgentStatus

```typescript
interface AgentStatus {
  agent_id: string;
  verdict: 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  uptime_24h?: number;
  uptime_7d?: number;
  latency_p50?: number;
  latency_p95?: number;
  pass_rate?: number;
  total_checks: number;
}
```

### RunResult

```typescript
interface RunResult {
  decision_id: string;
  verdict: 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';
  latency_p50?: number;
  latency_p95?: number;
  pass_rate?: number;
  total_probes: number;
  successful_probes: number;
  by_region?: RegionBreakdown[];
  judge_result?: JudgeResult;
}
```

## Error Handling

```typescript
import rora, { RoraError, RoraAuthError, RoraNotFoundError } from '@rora-ai/rora';

try {
  const status = await rora.status('invalid-id');
} catch (error) {
  if (error instanceof RoraNotFoundError) {
    console.log('Agent not found');
  } else if (error instanceof RoraAuthError) {
    console.log('Invalid API key');
  } else if (error instanceof RoraError) {
    console.log(`Error: ${error.message}`);
  }
}
```

## Gold Prompt Profiles

Rora uses "gold prompts" - carefully crafted test prompts for different agent types:

| Profile | Description |
|---------|-------------|
| `general` | Generic conversational prompts |
| `search_agent` | Web search and information retrieval |
| `code_generator` | Code generation and debugging |
| `data_retriever` | Database and API queries |
| `customer_support` | Support and FAQ handling |
| `creative_writer` | Content generation |

## Evaluation Types

| Type | Description |
|------|-------------|
| `basic` | Response format and latency checks |
| `llm_judge` | GPT-4 evaluates response quality |
| `all` | Both basic and LLM evaluation |

## Links

- [Dashboard](https://rora.carmel.so)
- [Python SDK](https://github.com/Carmel-Labs-Inc/rora-sdk)
- [GitHub](https://github.com/Carmel-Labs-Inc/rora-sdk-node)

## License

MIT
