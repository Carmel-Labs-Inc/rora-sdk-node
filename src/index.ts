/**
 * Rora SDK - Outside-in monitoring for AI agents
 *
 * @example
 * ```typescript
 * import rora from '@rora-ai/rora';
 *
 * // Initialize
 * rora.init({ apiKey: 'fb_live_xxx' });
 *
 * // Register an agent
 * const agent = await rora.register({
 *   endpoint: 'https://api.mycompany.com/chat',
 *   name: 'My Agent',
 * });
 *
 * // Check status
 * const status = await rora.status(agent.id);
 * console.log(status.verdict); // UP, DEGRADED, DOWN
 *
 * // One-off validation
 * const result = await rora.run({
 *   endpoint: 'https://api.example.com/chat',
 *   prompts: ['Hello'],
 * });
 * ```
 */

import { RoraClient } from './client';
import type {
  Agent,
  AgentStatus,
  RunResult,
  RegisterOptions,
  RunOptions,
  RoraConfig,
  Verdict,
  AuthConfig,
} from './types';

export {
  RoraError,
  RoraAuthError,
  RoraNotFoundError,
  RoraRateLimitError,
} from './errors';

export type {
  Agent,
  AgentStatus,
  RunResult,
  RegisterOptions,
  RunOptions,
  RoraConfig,
  Verdict,
  AuthConfig,
};

export { RoraClient };

let _client: RoraClient | null = null;

function getClient(): RoraClient {
  if (!_client) {
    throw new Error(
      "Rora SDK not initialized. Call rora.init({ apiKey: '...' }) first."
    );
  }
  return _client;
}

/**
 * Initialize the Rora SDK.
 *
 * @param config - Configuration with apiKey and optional baseUrl
 *
 * @example
 * ```typescript
 * rora.init({ apiKey: 'fb_live_xxx' });
 * ```
 */
export function init(config: RoraConfig): void {
  _client = new RoraClient(config);
}

/**
 * Register an agent for continuous monitoring.
 *
 * @param options - Registration options
 * @returns Registered agent
 *
 * @example
 * ```typescript
 * const agent = await rora.register({
 *   endpoint: 'https://api.mycompany.com/chat',
 *   name: 'Support Bot',
 *   interval_minutes: 60,
 * });
 * ```
 */
export async function register(options: RegisterOptions): Promise<Agent> {
  return getClient().register(options);
}

/**
 * Get the current status of a registered agent.
 *
 * @param agentId - Agent UUID
 * @returns Agent status with verdict, uptime, latency
 *
 * @example
 * ```typescript
 * const status = await rora.status('abc-123');
 * console.log(status.verdict); // UP, DEGRADED, DOWN
 * ```
 */
export async function status(agentId: string): Promise<AgentStatus> {
  return getClient().status(agentId);
}

/**
 * Run a one-off validation against an endpoint.
 *
 * @param options - Run options with endpoint and prompts
 * @returns Validation results
 *
 * @example
 * ```typescript
 * const result = await rora.run({
 *   endpoint: 'https://api.example.com/chat',
 *   prompts: ['Hello', 'What is 2+2?'],
 * });
 * ```
 */
export async function run(options: RunOptions): Promise<RunResult> {
  return getClient().run(options);
}

/**
 * Get an agent by ID.
 *
 * @param agentId - Agent UUID
 * @returns Agent object
 */
export async function getAgent(agentId: string): Promise<Agent> {
  return getClient().getAgent(agentId);
}

/**
 * List all registered agents.
 *
 * @returns Array of agents
 */
export async function listAgents(): Promise<Agent[]> {
  return getClient().listAgents();
}

/**
 * Delete a registered agent.
 *
 * @param agentId - Agent UUID
 * @returns true if deleted
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  return getClient().deleteAgent(agentId);
}

// Default export for convenience
export default {
  init,
  register,
  status,
  run,
  getAgent,
  listAgents,
  deleteAgent,
  RoraClient,
};
