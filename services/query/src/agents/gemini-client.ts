import { GoogleGenAI } from '@google/genai';

const candidateModels = [
    process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash'
];

/**
 * Generates content using Google Gemini with automatic multi-model fallback
 * to gracefully handle Free Tier per-model quotas and rate-limit spikes.
 */
export async function generateContentWithFallback(ai: GoogleGenAI, config: {
    contents: any;
    config?: any;
}): Promise<any> {
    let lastError: any;

    for (const model of candidateModels) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: config.contents,
                config: config.config
            });
            return response;
        } catch (err: any) {
            lastError = err;
            const isRateOrQuota =
                err.status === 429 ||
                err.status === 503 ||
                String(err.message || '').includes('429') ||
                String(err.message || '').includes('503') ||
                String(err.message || '').includes('quota') ||
                String(err.message || '').includes('UNAVAILABLE') ||
                String(err.message || '').includes('RESOURCE_EXHAUSTED');

            if (isRateOrQuota) {
                console.log(`[Gemini Resiliency] Model ${model} rate-limited or quota reached. Switching to next model...`);
                await new Promise((resolve) => setTimeout(resolve, 1500));
                continue;
            }
            throw err;
        }
    }

    throw lastError;
}
