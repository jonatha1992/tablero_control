export interface AgentConfig {
  name: string;
  description: string;
  enabled: boolean;
  schedule?: string;
  triggerType: 'manual' | 'scheduled' | 'event';
  settings: Record<string, unknown>;
}

export interface AgentLog {
  id: string;
  agentName: string;
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  status: 'success' | 'error' | 'partial';
  error?: string;
  durationMs?: number;
  timestamp: Date;
}

export interface AgentSuggestion {
  label: string;
  description: string;
  action: string;
  params: Record<string, unknown>;
}

export interface AgentAction {
  type: string;
  payload: Record<string, unknown>;
}

export interface AgentInput {
  context: Record<string, unknown>;
  prompt?: string;
  options?: Record<string, unknown>;
}

export interface AgentOutput {
  content: string;
  metadata: Record<string, unknown>;
  suggestions?: AgentSuggestion[];
  actions?: AgentAction[];
}
