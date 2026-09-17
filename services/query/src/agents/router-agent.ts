import { GoogleGenAI, Type } from '@google/genai';
import { RouterClassification, RouterClassificationSchema } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const ROUTER_SYSTEM_PROMPT = `You are the ACME Multi-Agent Router.
Analyze the user's inquiry and classify it to the most qualified specialist agent.

Agents available:
1. 'policy-agent': Handles HR, travel policies, hotel reimbursement limits, remote work stipends, financial guidelines, and expense approvals.
2. 'knowledge-agent': Handles engineering guidelines, technical specifications, system architecture, security compliance, IT procedures, and general handbook info.

Output MUST strictly follow the requested JSON schema.`;

export async function routeQuery(userQuery: string): Promise<RouterClassification> {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `User Query: "${userQuery}"` }]
                }
            ],
            config: {
                systemInstruction: ROUTER_SYSTEM_PROMPT,
                temperature: 0.0,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        target_agent: {
                            type: Type.STRING,
                            enum: ['policy-agent', 'knowledge-agent']
                        },
                        category: {
                            type: Type.STRING,
                            description: 'Domain category (e.g., finance, hr, engineering, security)'
                        },
                        confidence: {
                            type: Type.NUMBER,
                            description: 'Confidence between 0.0 and 1.0'
                        },
                        reasoning: {
                            type: Type.STRING,
                            description: 'Brief justification for routing decision'
                        }
                    },
                    required: ['target_agent', 'category', 'confidence', 'reasoning']
                }
            }
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText);
        return RouterClassificationSchema.parse(parsed);
    } catch (error) {
        console.error('[Router Agent] Classification failed, falling back to policy-agent default:', error);
        return {
            target_agent: 'policy-agent',
            category: 'general',
            confidence: 0.5,
            reasoning: 'Fallback routing due to classification exception'
        };
    }
}