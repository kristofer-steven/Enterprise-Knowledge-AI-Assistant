import { GoogleGenAI } from '@google/genai';
import { retrieveRelevantChunks } from '../retrieve.js';
import { A2ATaskRequest, A2ATaskResponse, A2ASourceCitation } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const POLICY_AGENT_SYSTEM_PROMPT = `You are the ACME Enterprise Policy Agent.
Your domain expertise covers: Corporate Travel, Expense Reimbursement, HR Guidelines, Remote Work Stipends, and Financial Compliance.

STRICT INSTRUCTIONS:
1. Base your answer ONLY on the provided Context excerpts.
2. If the user asks about specific numbers (e.g. hotel maximums, equipment allowances, per-diem rates), state the exact figure and currency.
3. If the context does not contain the answer, explicitly state: "Information not available in the company policy manual."
4. Never assume or extrapolate policy terms.
5. Provide precise citations mentioning the document title, section, and page number.`;

export async function executePolicyAgent(request: A2ATaskRequest): Promise<A2ATaskResponse> {
    const startTime = Date.now();

    // 1. Retrieve policy documents (optionally scoped or weighted for policy domains)
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

    // If no policy context found, return guarded answer immediately
    if (chunks.length === 0) {
        return {
            task_id: request.task_id,
            responding_agent: 'policy-agent',
            query: request.query,
            answer: 'I could not find any official ACME policy covering this request in the knowledge base.',
            sources: [],
            delegated: false,
            confidence: 0.0,
            execution_time_ms: Date.now() - startTime,
            timestamp: new Date().toISOString()
        };
    }

    // 2. Synthesize answer using specialized policy system prompt
    const contextText = chunks
        .map((c, i) => `[Document: ${c.title} | Section: ${c.category} | Page: ${c.page} (Score: ${c.score.toFixed(3)})]\n${c.content}`)
        .join('\n\n---\n\n');

    const prompt = `User Policy Question: ${request.query}\n\nContext:\n${contextText}\n\nAnswer:`;

    const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            systemInstruction: POLICY_AGENT_SYSTEM_PROMPT,
            temperature: 0.1
        }
    });

    const answer = response.text || 'Unable to generate policy response.';
    const topScore = chunks[0]?.score || 0;

    return {
        task_id: request.task_id,
        responding_agent: 'policy-agent',
        query: request.query,
        answer,
        sources,
        delegated: false,
        confidence: parseFloat(topScore.toFixed(4)),
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
    };
}