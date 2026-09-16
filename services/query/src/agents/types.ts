import { z } from 'zod';

// =======================================================
// 1. Agent Metadata & Capabilities
// =======================================================

export type AgentId = 'policy-agent' | 'knowledge-agent' | 'router-agent';

export interface AgentCapability {
    id: AgentId;
    name: string;
    description: string;
    domain: string[];
    supportedTools: string[];
}

// =======================================================
// 2. Router Classification Types
// =======================================================

export const RouterClassificationSchema = z.object({
    target_agent: z.enum(['policy-agent', 'knowledge-agent']),
    category: z.string().describe('Identified domain category (e.g., finance, hr, engineering, security)'),
    confidence: z.number().min(0).max(1).describe('Classification confidence score between 0.0 and 1.0'),
    reasoning: z.string().describe('Explanation of why this agent was selected')
});

export type RouterClassification = z.infer<typeof RouterClassificationSchema>;

// =======================================================
// 3. A2A Task Envelope (Request / Response)
// =======================================================

export interface A2ATaskRequest {
    task_id: string;
    sender_agent: AgentId | 'user' | 'router-agent';
    target_agent: AgentId;
    query: string;
    context?: Record<string, any>;
    delegation_chain?: AgentId[];
    timestamp: string;
}

export interface A2ASourceCitation {
    document: string;
    document_id: string;
    section: string;
    page: number;
    score: number;
}

export interface A2ATaskResponse {
    task_id: string;
    responding_agent: AgentId;
    query: string;
    answer: string;
    sources: A2ASourceCitation[];
    delegated: boolean;
    delegated_to?: AgentId;
    confidence: number;
    execution_time_ms: number;
    timestamp: string;
}

// =======================================================
// 4. Multi-Agent Orchestration Response
// =======================================================

export interface MultiAgentChatResponse {
    success: boolean;
    query: string;
    routed_to: AgentId;
    routing_reason: string;
    routing_confidence: number;
    response: A2ATaskResponse;
    provenance: {
        router_model: string;
        agent_model: string;
        total_latency_ms: number;
    };
}