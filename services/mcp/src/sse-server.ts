import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createEnterpriseKnowledgeMcpServer } from './server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = express();
const port = parseInt(process.env.MCP_SERVER_PORT || '3003', 10);

const mcpServer = createEnterpriseKnowledgeMcpServer();

// Map of active transports by session ID
const transports = new Map<string, SSEServerTransport>();

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'enterprise-knowledge-mcp', active_sessions: transports.size });
});

// SSE Connection Endpoint
app.get('/sse', async (req, res) => {
    console.log('[MCP SSE] New client connection request received');

    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;

    transports.set(sessionId, transport);

    transport.onclose = () => {
        console.log(`[MCP SSE] Session ${sessionId} closed`);
        transports.delete(sessionId);
    };

    await mcpServer.connect(transport);
    console.log(`[MCP SSE] Session ${sessionId} established and connected`);
});

// JSON-RPC Message Ingestion Endpoint
app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId || !transports.has(sessionId)) {
        res.status(404).send('Session not found or expired');
        return;
    }

    const transport = transports.get(sessionId)!;
    await transport.handlePostMessage(req, res);
});

app.listen(port, () => {
    console.log(`[MCP SSE Server] Listening at http://localhost:${port}`);
    console.log(`[MCP SSE Server] SSE endpoint: http://localhost:${port}/sse`);
    console.log(`[MCP SSE Server] Message endpoint: http://localhost:${port}/messages`);
});
