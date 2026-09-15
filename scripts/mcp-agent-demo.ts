import { Client } from '../services/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { StdioClientTransport } from '../services/mcp/node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js';
import { GoogleGenAI } from '../services/query/node_modules/@google/genai/dist/src/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

async function runMcpAgent(userPrompt: string) {
    console.log(`\n🤖 User Question: "${userPrompt}"`);

    // 1. Connect to MCP Server via stdio
    const serverScriptPath = path.resolve(__dirname, '../services/mcp/dist/index.js');
    const transport = new StdioClientTransport({
        command: 'node',
        args: [serverScriptPath]
    });

    const mcpClient = new Client({ name: 'gemini-mcp-agent', version: '1.0.0' }, { capabilities: {} });
    await mcpClient.connect(transport);

    // 2. Discover MCP Tools
    const { tools } = await mcpClient.listTools();

    // Map MCP tool declarations to Gemini Function Declarations
    const functionDeclarations = tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.inputSchema as any
    }));

    // 3. Prompt Gemini with tool declarations
    console.log(`⚙️  Agent thinking (evaluating ${tools.length} MCP tools)...`);
    const initialResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }]
            }
        ],
        config: {
            systemInstruction: `You are an enterprise AI assistant with access to company knowledge base tools via MCP.
Always use tools to find factual policy details. Never guess or hallucinate.
When presenting an answer, cite the document name, section, and page number.`,
            tools: [{ functionDeclarations }]
        }
    });

    // 4. Check if Gemini requested a tool execution
    const toolCalls = initialResponse.functionCalls;

    if (!toolCalls || toolCalls.length === 0) {
        console.log('\n💬 Agent Response (no tool called):');
        console.log(initialResponse.text);
        await mcpClient.close();
        return;
    }

    // 5. Execute requested MCP tool
    const firstCall = toolCalls[0];
    console.log(`\n⚡ Tool Selected by Agent: '${firstCall.name}'`);
    console.log(`   Arguments:`, JSON.stringify(firstCall.args));

    const toolExecutionResult: any = await mcpClient.callTool({
        name: firstCall.name,
        arguments: firstCall.args as any
    });

    const toolResponseText = toolExecutionResult.content?.[0]?.text || '';
    console.log(`   Result snippet: ${toolResponseText.slice(0, 150)}...\n`);

    // 6. Provide tool output back to Gemini for grounded synthesis
    console.log('✍️  Synthesizing grounded answer with citations...');
    const synthesisResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }]
            },
            {
                role: 'model',
                parts: [{ functionCall: firstCall }]
            },
            {
                role: 'user',
                parts: [
                    {
                        functionResponse: {
                            name: firstCall.name,
                            response: { result: toolResponseText }
                        }
                    }
                ]
            }
        ],
        config: {
            systemInstruction: 'Synthesize a clear, accurate, professional answer using ONLY the tool response. Cite source document, section, and page.'
        }
    });

    console.log('\n====================================================');
    console.log('  FINAL GROUNDED ANSWER (via MCP):');
    console.log('====================================================\n');
    console.log(synthesisResponse.text);
    console.log('\n====================================================');

    await mcpClient.close();
}

const prompt = process.argv[2] || 'What is the maximum reimbursement for hotel in New York?';
runMcpAgent(prompt).catch(console.error);
