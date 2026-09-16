import { A2ATaskRequest, A2ATaskResponse, AgentId } from './types.js';
import { AgentRegistry } from './registry.js';
import { executePolicyAgent } from './policy-agent.js';

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
        delegated: true,
        delegated_to: targetAgentId,
        execution_time_ms: Date.now() - startTime
    };
}
