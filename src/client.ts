/**
 * Rora SDK Client
 */

import {
  Agent,
  AgentStatus,
  RunResult,
  RegisterOptions,
  RunOptions,
  RoraConfig,
  Verdict,
} from './types';
import {
  RoraError,
  RoraAuthError,
  RoraNotFoundError,
  RoraRateLimitError,
} from './errors';

const DEFAULT_BASE_URL = 'https://api.fabric.carmel.so';
const DEFAULT_TIMEOUT = 60000;

export class RoraClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: RoraConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  private getAuthHeaders(): Record<string, string> {
    // fb_live_* keys use X-API-Key, JWT tokens use Bearer
    if (this.apiKey.startsWith('fb_live_') || this.apiKey.startsWith('fb_test_')) {
      return { 'X-API-Key': this.apiKey };
    }
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
          'User-Agent': 'rora-sdk-node/0.1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: unknown;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      // Handle errors
      if (response.status === 401) {
        throw new RoraAuthError('Invalid API key', data);
      }
      if (response.status === 404) {
        throw new RoraNotFoundError('Resource not found', data);
      }
      if (response.status === 429) {
        throw new RoraRateLimitError('Rate limit exceeded', data);
      }
      if (!response.ok) {
        const detail = (data as { detail?: string })?.detail || 'Unknown error';
        throw new RoraError(`API error: ${detail}`, response.status, data);
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof RoraError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new RoraError('Request timed out');
      }
      throw new RoraError(`Request failed: ${(error as Error).message}`);
    }
  }

  /**
   * Register an agent for continuous monitoring.
   */
  async register(options: RegisterOptions): Promise<Agent> {
    const payload = {
      endpoint_url: options.endpoint,
      name: options.name,
      interval_minutes: options.interval_minutes ?? 360,
      max_nodes_per_run: options.max_nodes_per_run ?? 5,
      eval_type: options.eval_type ?? 'basic',
      gold_prompt_profile: options.gold_prompt_profile ?? 'general',
      timeout_ms: options.timeout_ms ?? 30000,
      streaming: options.streaming ?? false,
      inject_geo_context: options.inject_geo_context ?? false,
      schedule_type: 'interval',
      status: 'active',
      ...(options.auth && { auth: options.auth }),
      ...(options.prompts && { prompts: options.prompts }),
      ...(options.geos && { geos: options.geos }),
    };

    return this.request<Agent>('POST', '/api/rora/agents', payload);
  }

  /**
   * Get current status of an agent.
   */
  async status(agentId: string): Promise<AgentStatus> {
    const data = await this.request<Record<string, unknown>>(
      'GET',
      `/api/rora/agents/${agentId}/status`
    );

    // Map API response
    const verdictStr = ((data.last_verdict as string) || 'UNKNOWN').toUpperCase();
    const verdict: Verdict = ['UP', 'DEGRADED', 'DOWN'].includes(verdictStr)
      ? (verdictStr as Verdict)
      : 'UNKNOWN';

    return {
      agent_id: agentId,
      verdict,
      uptime_24h: data.uptime_24h as number | undefined,
      uptime_7d: data.uptime_7d as number | undefined,
      latency_p50: (data.latency_p50_ms || data.latency_p50) as number | undefined,
      latency_p95: (data.latency_p95_ms || data.latency_p95) as number | undefined,
      pass_rate: data.pass_rate as number | undefined,
      gold_pass_rate: data.gold_pass_rate as number | undefined,
      last_checked: data.last_run_at as string | undefined,
      total_checks: (data.total_runs_24h as number) || 0,
      by_region: data.by_region as Record<string, unknown> | undefined,
    };
  }

  /**
   * Run a one-off validation.
   */
  async run(options: RunOptions): Promise<RunResult> {
    const payload = {
      endpoint_url: options.endpoint,
      prompts: options.prompts,
      max_nodes: options.max_nodes ?? 3,
      timeout_ms: options.timeout_ms ?? 30000,
      eval_type: options.eval_type ?? 'basic',
      ...(options.auth && { auth: options.auth }),
      ...(options.geos && { geos: options.geos }),
    };

    // Submit run
    const submitData = await this.request<{ decision_id: string }>(
      'POST',
      '/api/rora/run',
      payload
    );
    const decisionId = submitData.decision_id;

    if (!decisionId) {
      throw new RoraError('No decision_id returned from run submission');
    }

    // Poll for results (max 2 minutes)
    const maxWait = 120000;
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const resultData = await this.request<Record<string, unknown>>(
        'GET',
        `/api/rora/runs/${decisionId}`
      );

      const status = (resultData.status as string) || 'pending';
      if (status === 'completed') {
        return this.parseRunResult(decisionId, resultData);
      }
      if (status === 'failed') {
        throw new RoraError(
          `Run failed: ${resultData.error || 'Unknown error'}`,
          undefined,
          resultData
        );
      }

      await this.sleep(pollInterval);
    }

    throw new RoraError('Run timed out after 120 seconds', undefined, {
      decision_id: decisionId,
    });
  }

  private parseRunResult(
    decisionId: string,
    data: Record<string, unknown>
  ): RunResult {
    const verdictStr = (
      (data.verdict as string) ||
      (data.status as string) ||
      'UNKNOWN'
    ).toUpperCase();
    const verdict: Verdict = ['UP', 'DEGRADED', 'DOWN'].includes(verdictStr)
      ? (verdictStr as Verdict)
      : 'UNKNOWN';

    return {
      decision_id: decisionId,
      verdict,
      latency_p50: (data.latency_p50_ms || data.latency_p50) as number | undefined,
      latency_p95: (data.latency_p95_ms || data.latency_p95) as number | undefined,
      latency_p99: (data.latency_p99_ms || data.latency_p99) as number | undefined,
      ttfb_p50: data.ttfb_p50_ms as number | undefined,
      ttfb_p95: data.ttfb_p95_ms as number | undefined,
      pass_rate: data.pass_rate as number | undefined,
      gold_pass_rate: data.gold_pass_rate as number | undefined,
      total_probes: (data.total_probes as number) || 0,
      successful_probes: (data.successful_probes as number) || 0,
      failed_probes: (data.failed_probes as number) || 0,
      by_region: data.by_region as RunResult['by_region'],
      probe_results: data.probe_results as RunResult['probe_results'],
      judge_result: data.judge_result as RunResult['judge_result'],
      tested_at: data.tested_at as string | undefined,
    };
  }

  /**
   * Get an agent by ID.
   */
  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>('GET', `/api/rora/agents/${agentId}`);
  }

  /**
   * List all agents.
   */
  async listAgents(): Promise<Agent[]> {
    const data = await this.request<{ agents?: Agent[] } | Agent[]>(
      'GET',
      '/api/rora/agents'
    );
    if (Array.isArray(data)) return data;
    return data.agents || [];
  }

  /**
   * Delete an agent.
   */
  async deleteAgent(agentId: string): Promise<boolean> {
    await this.request<unknown>('DELETE', `/api/rora/agents/${agentId}`);
    return true;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
