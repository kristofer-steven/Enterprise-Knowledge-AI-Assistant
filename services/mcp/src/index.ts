import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEnterpriseKnowledgeMcpServer } from './server.js';

// Load root .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

async function main() {
    const server = createEnterpriseKnowledgeMcpServer();
    const transport = new StdioServerTransport();

    // Stderr logging is safe and won't break JSON-RPC protocol
    console.error('[MCP Server] Initializing Enterprise Knowledge MCP (stdio transport)...');

    await server.connect(transport);
    console.error('[MCP Server] Connected to stdio. Ready for JSON-RPC requests.');
}

main().catch((error) => {
    console.error('[MCP Server] Fatal initialization error:', error);
    process.exit(1);
});
