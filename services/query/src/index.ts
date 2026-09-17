import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')] });

import express, { Request, Response } from 'express';
import { retrieveRelevantChunks } from './retrieve.js';
import { generateGroundedAnswer } from './generate.js';
import { orchestrateMultiAgentChat, handleA2ADelegation } from './agents/a2a-service.js';
import { AgentRegistry } from './agents/registry.js';
import { A2ATaskRequest } from './agents/types.js';

const app = express();
const port = parseInt(process.env.QUERY_PORT || '3002', 10);

app.use(express.json());

// --- Health Check ---
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'query-and-agent-service',
        timestamp: new Date().toISOString()
    });
});

// --- Agent Discovery Endpoint ---
app.get('/api/agents', (req: Request, res: Response) => {
    res.json({
        agents: AgentRegistry.getAllAgents()
    });
});

// --- Multi-Agent Supervised Chat Endpoint ---
app.post('/api/agents/chat', async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Field "message" is required and must be a string' });
        }

        const result = await orchestrateMultiAgentChat(message);
        return res.json(result);
    } catch (error: any) {
        console.error('[API /api/agents/chat] Error:', error);
        return res.status(500).json({ error: error.message || 'Internal multi-agent error' });
    }
});

// --- Direct A2A Delegation Endpoint ---
app.post('/api/a2a/delegate', async (req: Request, res: Response) => {
    try {
        const taskRequest = req.body as A2ATaskRequest;
        if (!taskRequest || !taskRequest.query || !taskRequest.target_agent) {
            return res.status(400).json({ error: 'Fields "query" and "target_agent" are required' });
        }

        const taskResult = await handleA2ADelegation(taskRequest);
        return res.json(taskResult);
    } catch (error: any) {
        console.error('[API /api/a2a/delegate] Error:', error);
        return res.status(500).json({ error: error.message || 'A2A delegation error' });
    }
});

// --- Legacy RAG Endpoint (Week 2 backward compatibility) ---
app.post('/api/chat', async (req: Request, res: Response) => {
    try {
        const { message, category, top_k, topK, threshold } = req.body;
        const cleanMessage = typeof message === 'string' ? message.trim().replace(/^=/, '').trim() : '';
        const cleanCategory = typeof category === 'string' && category.trim() !== '' && category.trim() !== '='
            ? category.trim()
            : undefined;

        if (!cleanMessage) {
            return res.status(400).json({ error: 'Query message is required and cannot be empty.' });
        }

        const effectiveTopK = top_k || topK || 5;
        const effectiveThreshold = threshold !== undefined ? threshold : 0.70;

        const chunks = await retrieveRelevantChunks(cleanMessage, {
            categoryFilter: cleanCategory,
            topK: effectiveTopK,
            similarityThreshold: effectiveThreshold
        });

        const answerResult = await generateGroundedAnswer(cleanMessage, chunks);

        return res.json({
            success: true,
            query: cleanMessage,
            answer: answerResult.answer,
            sources: answerResult.sources,
            retrieval_count: chunks.length,
            confidence: answerResult.confidence
        });
    } catch (error: any) {
        console.error('RAG Query error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`[Query & Agent Service] Listening at http://localhost:${port}`);
    console.log(`[Query & Agent Service] Multi-Agent Endpoint: http://localhost:${port}/api/agents/chat`);
    console.log(`[Query & Agent Service] A2A Delegation Endpoint: http://localhost:${port}/api/a2a/delegate`);
});