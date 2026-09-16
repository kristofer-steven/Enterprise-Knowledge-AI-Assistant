import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')] });

import { executeKnowledgeAgent } from './agents/knowledge-agent.js';
import { executePolicyAgent } from './agents/policy-agent.js';

async function runA2ATest() {
    console.log('=== Test 1: Policy Agent Direct Call ===');
    const policyReq = {
        task_id: 'task-policy-1',
        sender_agent: 'user' as const,
        target_agent: 'policy-agent' as const,
        query: 'What is the hotel per diem rate for tier 1 cities?',
        timestamp: new Date().toISOString()
    };
    const policyRes = await executePolicyAgent(policyReq);
    console.log(`[Policy Agent] Response confidence: ${policyRes.confidence}`);
    console.log(`[Policy Agent] Sources cited: ${policyRes.sources.length}`);
    console.log(`[Policy Agent] Answer snippet: ${policyRes.answer.slice(0, 120)}...\n`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('=== Test 2: Knowledge Agent Direct Call (Technical Query) ===');
    const technicalReq = {
        task_id: 'task-tech-1',
        sender_agent: 'user' as const,
        target_agent: 'knowledge-agent' as const,
        query: 'What are the core principles of the microservice architecture?',
        timestamp: new Date().toISOString()
    };
    const techRes = await executeKnowledgeAgent(technicalReq);
    console.log(`[Knowledge Agent] Response confidence: ${techRes.confidence}`);
    console.log(`[Knowledge Agent] Delegated: ${techRes.delegated}`);
    console.log(`[Knowledge Agent] Answer snippet: ${techRes.answer.slice(0, 120)}...\n`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log('=== Test 3: Knowledge Agent -> Policy Agent Delegation (A2A) ===');
    const delegationReq = {
        task_id: 'task-delegation-1',
        sender_agent: 'user' as const,
        target_agent: 'knowledge-agent' as const,
        query: 'Can you reimburse my travel expense and flight class?',
        timestamp: new Date().toISOString()
    };
    const delegationRes = await executeKnowledgeAgent(delegationReq);
    console.log(`[A2A Delegation] Responding Agent: ${delegationRes.responding_agent}`);
    console.log(`[A2A Delegation] Delegated: ${delegationRes.delegated}`);
    console.log(`[A2A Delegation] Delegated To: ${delegationRes.delegated_to}`);
    console.log(`[A2A Delegation] Sources cited: ${delegationRes.sources.length}`);
    console.log(`[A2A Delegation] Answer snippet: ${delegationRes.answer.slice(0, 120)}...\n`);
}

runA2ATest().catch(console.error);
