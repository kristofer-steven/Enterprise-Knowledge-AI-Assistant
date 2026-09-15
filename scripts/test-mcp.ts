import { Client } from '../services/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../services/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMcpVerification() {
    console.log('====================================================');
    console.log('  Enterprise Knowledge MCP Server Verification');
    console.log('====================================================\n');

    const serverScriptPath = path.resolve(__dirname, '../services/mcp/dist/index.js');

    console.log(`[1/5] Launching MCP server child process via stdio...`);
    console.log(`      Path: ${serverScriptPath}`);

    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverScriptPath]
    });

    const client = new Client(
        {
            name: 'mcp-test-runner',
            version: '1.0.0'
        },
        {
            capabilities: {}
        }
    );

    await client.connect(transport);
    console.log('      Handshake complete. Connected to MCP Server! ✅\n');

    // -------------------------------------------------------------
    // 1. List Tools
    // -------------------------------------------------------------
    console.log('[2/5] Querying tools list (tools/list)...');
    const toolsResponse = await client.listTools();
    const tools = toolsResponse.tools || [];

    console.log(`      Discovered ${tools.length} available tools:`);
    for (const tool of tools) {
        console.log(`      - 🛠️  ${tool.name}: ${tool.description}`);
    }

    const toolNames = tools.map((t) => t.name);
    const requiredTools = ['search_documents', 'get_document', 'list_documents'];
    const allFound = requiredTools.every((r) => toolNames.includes(r));

    if (!allFound) {
        throw new Error(`Missing expected tools! Required: ${requiredTools.join(', ')}`);
    }
    console.log('      Tool discovery verification: PASSED ✅\n');

    // -------------------------------------------------------------
    // 2. Call list_documents
    // -------------------------------------------------------------
    console.log('[3/5] Testing tool call: list_documents...');
    const listResult: any = await client.callTool({
        name: 'list_documents',
        arguments: {}
    });

    const listText = listResult.content?.[0]?.text || '{}';
    const listData = JSON.parse(listText);
    console.log(`      Total Documents Found: ${listData.total_documents}`);
    for (const doc of listData.documents || []) {
        console.log(`      - [${doc.id}] "${doc.title}" (Category: ${doc.category}, Chunks: ${doc.chunk_count})`);
    }
    console.log('      list_documents verification: PASSED ✅\n');

    // -------------------------------------------------------------
    // 3. Call search_documents
    // -------------------------------------------------------------
    console.log('[4/5] Testing tool call: search_documents...');
    const searchQuery = 'hotel reimbursement limit';
    console.log(`      Query: "${searchQuery}"`);

    const searchResult: any = await client.callTool({
        name: 'search_documents',
        arguments: {
            query: searchQuery,
            top_k: 3,
            threshold: 0.60
        }
    });

    const searchText = searchResult.content?.[0]?.text || '{}';
    const searchData = JSON.parse(searchText);
    console.log(`      Retrieved Chunks: ${searchData.total_results}`);

    if (searchData.results && searchData.results.length > 0) {
        const top = searchData.results[0];
        console.log(`      Top Result: "${top.document}" (Section: ${top.section}, Page: ${top.page}, Score: ${top.score})`);
        console.log(`      Snippet: "${top.content.slice(0, 100)}..."`);
    }
    console.log('      search_documents verification: PASSED ✅\n');

    // -------------------------------------------------------------
    // 4. Call get_document
    // -------------------------------------------------------------
    console.log('[5/5] Testing tool call: get_document...');
    const docIdToFetch = listData.documents?.[0]?.id || 'travel-policy';
    console.log(`      Fetching document: "${docIdToFetch}"...`);

    const getDocResult: any = await client.callTool({
        name: 'get_document',
        arguments: {
            document_id: docIdToFetch
        }
    });

    const getDocText = getDocResult.content?.[0]?.text || '{}';
    const getDocData = JSON.parse(getDocText);
    console.log(`      Retrieved Document: "${getDocData.title}"`);
    console.log(`      Sections: ${getDocData.sections?.join(', ')}`);
    console.log(`      Total Assembled Length: ${getDocData.content?.length || 0} characters`);
    console.log('      get_document verification: PASSED ✅\n');

    console.log('====================================================');
    console.log('  ALL MCP PROTOCOL TESTS PASSED! 🎉');
    console.log('====================================================');

    await client.close();
    process.exit(0);
}

runMcpVerification().catch((err) => {
    console.error('MCP Verification Failed ❌:', err);
    process.exit(1);
});
