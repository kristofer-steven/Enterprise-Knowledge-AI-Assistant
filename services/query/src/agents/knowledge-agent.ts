import { GoogleGenAI } from '@google/genai';
import { retrieveRelevantChunks } from '../retrieve.js';
import { A2ATaskRequest, A2ATaskResponse, A2ASourceCitation } from './types.js';
import { handleA2ADelegation } from './a2a-service.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const KNOWLEDGE_AGENT_SYSTEM_PROMPT = `You are the ACME Technical Knowledge Agent.
Your domain expertise covers: Engineering Architecture, IT Infrastructure, Cybersecurity Standards, Developer Handbooks, and General Documentation.

STRICT INSTRUCTIONS:
1. Provide technically accurate, grounded answers based solely on provided context.
2. If code snippets, API endpoints, or architecture principles are referenced, include them clearly in Markdown.
3. If the context does not contain the answer, state that the technical specification is not found.
4. Always cite document name, section, and page number.`;

export async function executeKnowledgeAgent(request: A2ATaskRequest): Promise<A2ATaskResponse> {
    const startTime = Date.now();

    // 1. Check if the question is actually a Policy question that requires A2A Delegation
    const policyKeywords = ['reimburse', 'hotel per diem', 'expense limit', 'flight class', 'vacation allowance', 'leave policy'];
    const isPolicyQuery = policyKeywords.some((kw) => request.query.toLowerCase().includes(kw));

    // Prevent delegation loops: only delegate if not already in delegation chain
    const alreadyDelegated = request.delegation_chain?.includes('policy-agent');

    if (isPolicyQuery && !alreadyDelegated) {
        console.log(`[Knowledge Agent] Detected policy inquiry in query: "${request.query}". Delegating to Policy Agent via A2A...`);
        return await handleA2ADelegation({
            ...request,
            sender_agent: 'knowledge-agent',
            target_agent: 'policy-agent',
            delegation_chain: [...(request.delegation_chain || []), 'knowledge-agent']
        });
    }

    // 2. Perform retrieval for technical documentation
    const chunks = await retrieveRelevantChunks(request.query, {
        topK: 5,
        similarityThreshold: 0.65
    });

    const sources: A2ASourceCitation[] = chunks.map((c) => ({
        document: c.title,
        document_id: c.document_id,
        section: c.category,
        page: c.page,
        score: c.score
    }));

    if (chunks.length === 0) {
        return {
            task_id: request.task_id,
            responding_agent: 'knowledge-agent',
            query: request.query,
            answer: 'No relevant engineering specifications or technical documentation found in the knowledge base.',
            sources: [],
            delegated: false,
            confidence: 0.0,
            execution_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
        };
    }

    // 3. Generate grounded technical response
    const contextText = chunks
        .map((c) => `[Doc: ${c.title} | Section: ${c.category} | Page: ${c.page}]\n${c.content}`)
        .join('\n\n---\n\n');

    const prompt = `Technical Question: ${request.query}\n\nContext:\n${contextText}\n\nAnswer:`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            systemInstruction: KNOWLEDGE_AGENT_SYSTEM_PROMPT,
            temperature: 0.1
        }
    });

    const answer = response.text || 'Unable to generate technical documentation response.';
    const topScore = chunks[0]?.score || 0;

    return {
        task_id: request.task_id,
        responding_agent: 'knowledge-agent',
        query: request.query,
        answer,
        sources,
        delegated: false,
        confidence: parseFloat(topScore.toFixed(4)),
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
    };
}