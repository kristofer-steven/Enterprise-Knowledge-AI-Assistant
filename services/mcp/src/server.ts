import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
    SearchDocumentsInputSchema,
    GetDocumentInputSchema,
    ListDocumentsInputSchema
} from './types.js';
import { handleSearchDocuments } from './tools/search.js';
import { handleGetDocument } from './tools/get-doc.js';
import { handleListDocuments } from './tools/list-docs.js';

export function createEnterpriseKnowledgeMcpServer(): McpServer {
    const server = new McpServer({
        name: 'enterprise-knowledge-mcp',
        version: '1.0.0'
    });

    // ==============================================================
    // Tool 1: search_documents (FR-010)
    // ==============================================================
    server.tool(
        'search_documents',
        'Semantically search the enterprise knowledge base vectors. Returns grounded excerpts, page numbers, and similarity scores.',
        {
            query: z.string().describe('The search query or natural language question to look up'),
            top_k: z.number().int().min(1).max(20).optional().default(5).describe('Number of relevant chunks to retrieve (default: 5)'),
            category: z.string().optional().describe('Optional category filter (e.g. "finance", "hr", "security")'),
            threshold: z.number().min(0).max(1).optional().default(0.65).describe('Minimum similarity score threshold (default: 0.65)')
        },
        async (args) => {
            try {
                const parsed = SearchDocumentsInputSchema.parse(args);
                const results = await handleSearchDocuments(parsed);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(results, null, 2)
                        }
                    ]
                };
            } catch (err: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: err.message || 'Search execution failed' })
                        }
                    ],
                    isError: true
                };
            }
        }
    );

    // ==============================================================
    // Tool 2: get_document (FR-011)
    // ==============================================================
    server.tool(
        'get_document',
        'Retrieve complete document content and section breakdown by unique document_id.',
        {
            document_id: z.string().describe('The document ID to fetch (e.g. "travel-policy", "remote-work-policy")')
        },
        async (args) => {
            try {
                const parsed = GetDocumentInputSchema.parse(args);
                const doc = await handleGetDocument(parsed);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(doc, null, 2)
                        }
                    ]
                };
            } catch (err: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: err.message || 'Get document failed' })
                        }
                    ],
                    isError: true
                };
            }
        }
    );

    // ==============================================================
    // Tool 3: list_documents (FR-012)
    // ==============================================================
    server.tool(
        'list_documents',
        'List all available policy and knowledge documents in the enterprise repository with chunk counts.',
        {},
        async () => {
            try {
                const docs = await handleListDocuments();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(docs, null, 2)
                        }
                    ]
                };
            } catch (err: any) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ error: err.message || 'List documents failed' })
                        }
                    ],
                    isError: true
                };
            }
        }
    );

    return server;
}
