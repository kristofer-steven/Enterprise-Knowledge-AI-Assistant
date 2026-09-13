import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')] });

import express, { Request, Response } from 'express';
import { retrieveRelevantChunks } from './retrieve';
import { generateGroundedAnswer } from './generate';
import { ChatRequest, ChatResponse } from './types';

const app = express();
const PORT = process.env.QUERY_PORT || 3002;

app.use(express.json());

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'query-service' });
});

// --- RAG Chat Endpoint ---
app.post('/api/chat', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse | { success: false; error: string }>) => {
    try {
        const { message, category, topK } = req.body;
        const cleanMessage = typeof message === 'string' ? message.trim().replace(/^=/, '').trim() : '';
        const cleanCategory = typeof category === 'string' && category.trim() !== '' && category.trim() !== '='
            ? category.trim()
            : undefined;

        console.log(`[RAG Chat] Received message: "${cleanMessage}", category: "${cleanCategory || 'all'}"`);

        if (!cleanMessage) {
            return res.status(400).json({
                success: false,
                error: 'Query message is required and cannot be empty.',
            });
        }

        // 1. Retrieve semantically matching chunks
        const chunks = await retrieveRelevantChunks(cleanMessage, {
            categoryFilter: cleanCategory,
            topK,
        });

        // 2. Generate grounded answer via LLM
        const ragResult = await generateGroundedAnswer(cleanMessage, chunks);

        // 3. Return formatted response
        return res.status(200).json({
            success: true,
            answer: ragResult.answer,
            sources: ragResult.sources,
            retrieval_count: chunks.length,
            confidence: ragResult.confidence,
        });
    } catch (error: any) {
        console.error('RAG Query error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error processing RAG query.',
        });
    }
});

app.listen(PORT, () => {
    console.log(`Query service running on port ${PORT}`);
});