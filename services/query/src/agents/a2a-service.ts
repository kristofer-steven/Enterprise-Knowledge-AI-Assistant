import { randomUUID } from 'crypto';
import { A2ATaskRequest, A2ATaskResponse, AgentId, MultiAgentChatResponse } from './types.js';
import { AgentRegistry } from './registry.js';
import { executePolicyAgent } from './policy-agent.js';
import { routeQuery } from './router-agent.js';

/**
 * Dispatches an A2A task request directly to the target agent executor.
 */
export async function dispatchA2ATask(request: A2ATaskRequest): Promise<A2ATaskResponse> {
    if (request.target_agent === 'policy-agent') {
        return await executePolicyAgent(request);
    } else if (request.target_agent === 'knowledge-agent') {
        // Dynamic import to avoid potential circular dependency with knowledge-agent
        const { executeKnowledgeAgent } = await import('./knowledge-agent.js');
        return await executeKnowledgeAgent(request);
    }

    throw new Error(`Unsupported target agent: '${request.target_agent}'`);
}

/**
 * Handles agent-to-agent (A2A) delegation between specialized agents.
 * Validates target capability in AgentRegistry, guards against cyclical delegation loops,
 * executes the delegated agent, and decorates the task response with delegation metadata.
 */
export async function handleA2ADelegation(request: A2ATaskRequest): Promise<A2ATaskResponse> {
    const startTime = Date.now();
    const targetAgentId = request.target_agent;

    // 1. Verify target agent exists in registry
    const targetCapability = AgentRegistry.getAgent(targetAgentId);
    if (!targetCapability) {
        throw new Error(`A2A Delegation Error: Target agent '${targetAgentId}' not found in AgentRegistry.`);
    }

    // 2. Loop prevention check
    const chain = request.delegation_chain || [];
    const occurrences = chain.filter((id) => id === targetAgentId).length;
    if (occurrences > 0) {
        throw new Error(
            `A2A Delegation Error: Circular delegation detected. Target '${targetAgentId}' already exists in chain: [${chain.join(' -> ')}]`
        );
    }

    console.log(`[A2A Service] Delegating task "${request.task_id}" from [${request.sender_agent}] to [${targetAgentId}]`);

    // 3. Dispatch task to the target agent
    const response = await dispatchA2ATask(request);

    // 4. Return response marked with delegation provenance
    return {
        ...response,
        delegated: request.sender_agent !== 'user' && request.sender_agent !== 'router-agent',
        delegated_to: targetAgentId,
        execution_time_ms: Date.now() - startTime
    };
}

/**
 * Orchestrates an end-to-end multi-agent chat interaction:
 * 1. Router Agent classifies the intent and domain.
 * 2. Creates an A2A task request envelope.
 * 3. Delegates execution to the chosen specialist agent.
 * 4. Returns unified response with provenance.
 */
export async function orchestrateMultiAgentChat(userQuery: string): Promise<MultiAgentChatResponse> {
    const totalStart = Date.now();

    // 1. Router Agent analyzes intent and classifies query
    const routing = await routeQuery(userQuery);
    console.log(`[Router Agent] Query: "${userQuery}" ──► Target: ${routing.target_agent} (Confidence: ${routing.confidence}, Category: ${routing.category})`);

    // 2. Build A2A Task Envelope
    const taskRequest: A2ATaskRequest = {
        task_id: randomUUID(),
        sender_agent: 'router-agent',
        target_agent: routing.target_agent,
        query: userQuery,
        timestamp: new Date().toISOString()
    };

    // 3. Delegate to selected specialist agent
    const agentResponse = await handleA2ADelegation(taskRequest);

    return {
        success: true,
        query: userQuery,
        routed_to: routing.target_agent,
        routing_reason: routing.reasoning,
        routing_confidence: routing.confidence,
        response: agentResponse,
        provenance: {
            router_model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            agent_model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
            total_latency_ms: Date.now() - totalStart
        }
    };
}
