/**
 * Rora SDK Types
 */

export type Verdict = 'UP' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export interface AuthConfig {
  type: 'bearer' | 'api_key' | 'basic';
  token?: string;
  header?: string;
  value?: string;
  username?: string;
  password?: string;
}

export interface Agent {
  id: string;
  name: string;
  endpoint_url: string;
  status: 'active' | 'paused' | 'deleted';
  interval_minutes: number;
  max_nodes_per_run: number;
  geos?: string[];
  eval_type: 'basic' | 'llm_judge' | 'all';
  gold_prompt_profile: string;
  timeout_ms: number;
  streaming: boolean;
  inject_geo_context: boolean;
  last_run_at?: string;
  next_run_at?: string;
  last_status?: Verdict;
  created_at?: string;
}

export interface AgentStatus {
  agent_id: string;
  verdict: Verdict;
  uptime_24h?: number;
  uptime_7d?: number;
  latency_p50?: number;
  latency_p95?: number;
  pass_rate?: number;
  gold_pass_rate?: number;
  last_checked?: string;
  total_checks: number;
  by_region?: Record<string, unknown>;
}

export interface ProbeResult {
  node_id?: string;
  geo?: string;
  status: string;
  latency_ms?: number;
  ttfb_ms?: number;
  success: boolean;
  response_preview?: string;
  error?: string;
  gold_results?: Record<string, boolean>;
}

export interface RegionBreakdown {
  region: string;
  verdict: Verdict;
  probe_count: number;
  pass_rate?: number;
  latency_p50?: number;
  latency_p95?: number;
}

export interface JudgeResult {
  verdict: 'PASS' | 'FAIL' | 'PARTIAL';
  score: number;
  reasoning?: string;
  issues?: string[];
}

export interface RunResult {
  decision_id: string;
  verdict: Verdict;
  latency_p50?: number;
  latency_p95?: number;
  latency_p99?: number;
  ttfb_p50?: number;
  ttfb_p95?: number;
  pass_rate?: number;
  gold_pass_rate?: number;
  total_probes: number;
  successful_probes: number;
  failed_probes: number;
  by_region?: RegionBreakdown[];
  probe_results?: ProbeResult[];
  judge_result?: JudgeResult;
  tested_at?: string;
}

export interface RegisterOptions {
  endpoint: string;
  name: string;
  auth?: AuthConfig;
  prompts?: string[];
  interval_minutes?: number;
  max_nodes_per_run?: number;
  geos?: string[];
  eval_type?: 'basic' | 'llm_judge' | 'all';
  gold_prompt_profile?: string;
  timeout_ms?: number;
  streaming?: boolean;
  inject_geo_context?: boolean;
}

export interface RunOptions {
  endpoint: string;
  prompts: string[];
  auth?: AuthConfig;
  max_nodes?: number;
  geos?: string[];
  timeout_ms?: number;
  eval_type?: 'basic' | 'llm_judge' | 'all';
}

export interface RoraConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}
