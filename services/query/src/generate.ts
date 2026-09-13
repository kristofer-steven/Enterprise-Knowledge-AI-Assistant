import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')] });

import { GoogleGenAI } from '@google/genai';
import { RetrievedChunk, CitationSource } from './types';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
});

export interface GeneratedAnswer {
    answer: string;
    sources: CitationSource[];
    confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Generates a grounded response using Google Gemini and retrieved chunks.
 */
export async function generateGroundedAnswer(
    userQuery: string,
    chunks: RetrievedChunk[]
): Promise<GeneratedAnswer> {
    // 1. Guardrail: If no chunks met similarity threshold, return strict refusal
    if (chunks.length === 0) {
        return {
            answer: 'Information not available in the company knowledge base.',
            sources: [],
            confidence: 'none',
        };
    }

    // 2. Format Context Passages with Explicit Citations
    const formattedContext = chunks
        .map((c, i) => `[Source ${i + 1}] Document: "${c.title}" (Page ${c.page}):\n${c.content}`)
        .join('\n\n---\n\n');

    // 3. Construct System & User Prompts
    const systemInstruction = `You are the official Enterprise Knowledge AI Assistant.
Your job is to provide factual, direct, and helpful answers to employee questions based STRICTLY on the provided company policy excerpts.

RULES:
1. Use ONLY facts directly mentioned in the CONTEXT below. Do NOT assume, extrapolate, or bring outside knowledge.
2. If the context does not contain the answer, state clearly: "Information not available in the company knowledge base."
3. Always cite which document and page number your answer comes from.
4. Keep answers concise, professional, and clear.`;

    const prompt = `CONTEXT EXCERPTS:
${formattedContext}

EMPLOYEE QUESTION:
${userQuery}

ANSWER:`;

    // 4. Call Gemini Model with fallback models for quota resiliency
    const candidateModels = [
        process.env.GEMINI_MODEL || 'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
    ];

    let response: any;
    let lastError: any;

    for (const currentModel of candidateModels) {
        try {
            response = await ai.models.generateContent({
                model: currentModel,
                contents: prompt,
                config: {
                    systemInstruction,
                    temperature: 0.1, // Low temperature for maximum factual consistency
                },
            });
            lastError = null;
            break;
        } catch (err: any) {
            lastError = err;
            const isQuotaOrRateLimit = err.status === 429 || String(err.message || '').includes('429');
            if (isQuotaOrRateLimit) {
                console.log(`[Gemini Quota] Model ${currentModel} rate-limited. Falling back to next available model...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }
            throw err;
        }
    }

    if (lastError && !response) {
        throw lastError;
    }

    const answerText = response.text ? response.text.trim() : 'Unable to generate answer.';

    // If model refuses because information is not in knowledge base, do not cite unrelated chunks
    const isRefusal = answerText.toLowerCase().includes('not available in the company knowledge base')
        || answerText.toLowerCase().includes('not available in the knowledge base');

    if (isRefusal) {
        return {
            answer: 'Information not available in the company knowledge base.',
            sources: [],
            confidence: 'none',
        };
    }

    // 5. Build Structured Citation Sources (de-duplicated by document and page)
    const sourcesMap = new Map<string, CitationSource>();
    for (const chunk of chunks) {
        const key = `${chunk.document_id}-p${chunk.page}`;
        if (!sourcesMap.has(key)) {
            sourcesMap.set(key, {
                document_id: chunk.document_id,
                title: chunk.title,
                page: chunk.page,
                score: Number(chunk.score.toFixed(4)),
            });
        }
    }

    // Determine confidence based on top retrieval score
    const topScore = chunks[0]?.score ?? 0;
    const confidence = topScore >= 0.85 ? 'high' : topScore >= 0.75 ? 'medium' : 'low';

    return {
        answer: answerText,
        sources: Array.from(sourcesMap.values()),
        confidence,
    };
}