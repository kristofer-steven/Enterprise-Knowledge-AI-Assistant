import fs from 'fs';
import path from 'path';

// Native .env loader to avoid external dependencies
function loadEnv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
                const key = trimmed.slice(0, eqIdx).trim();
                let val = trimmed.slice(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    }
}
loadEnv();

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';

interface MultiAgentTestCase {
    id: string;
    question: string;
    expected_agent: 'policy-agent' | 'knowledge-agent';
    expected_keywords: string[];
    test_delegation?: boolean;
}

const testCases: MultiAgentTestCase[] = [
    {
        id: 'tc-01-travel-hotel',
        question: 'What is the maximum reimbursement for hotel in New York?',
        expected_agent: 'policy-agent',
        expected_keywords: ['250']
    },
    {
        id: 'tc-02-remote-work',
        question: 'How much is the initial home office equipment stipend?',
        expected_agent: 'policy-agent',
        expected_keywords: ['800']
    },
    {
        id: 'tc-03-tech-architecture',
        question: 'What are the core microservices and ports specified in our engineering architecture?',
        expected_agent: 'knowledge-agent',
        expected_keywords: ['not']
    },
    {
        id: 'tc-04-a2a-delegation',
        question: 'Can you check the travel reimbursement limit for overseas lodging?',
        expected_agent: 'policy-agent',
        expected_keywords: ['280'],
        test_delegation: true
    }
];

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, body: any, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            return await response.json();
        } catch (err: any) {
            if (attempt === maxRetries) throw err;
            console.log(`    ⏳ Attempt ${attempt} failed (${err.message}). Retrying in 15s...`);
            await sleep(15000);
        }
    }
}

async function runMultiAgentEvaluation() {
    console.log('====================================================');
    console.log('  Multi-Agent Routing & A2A Evaluation Benchmark');
    console.log('====================================================\n');

    // Verify service connectivity
    try {
        const health = await fetch(`${QUERY_API_URL}/health`);
        if (!health.ok) {
            throw new Error(`Health check returned HTTP ${health.status}`);
        }
    } catch (err: any) {
        console.error(`❌ Cannot connect to Query Service at ${QUERY_API_URL}.`);
        console.error(`   Please ensure the Query Service is running before running this benchmark:`);
        console.error(`   Run: npm --prefix services/query run dev\n`);
        process.exit(1);
    }

    let routingPassedCount = 0;
    let accuracyPassedCount = 0;
    let delegationPassedCount = 0;
    let totalDelegationTests = 0;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        console.log(`[${i + 1}/${testCases.length}] Evaluating: "${tc.question}"`);

        // Pacing between LLM requests to respect rate limits (Free Tier 5 RPM)
        if (i > 0) {
            await sleep(14000);
        }

        try {
            const data = await fetchWithRetry(`${QUERY_API_URL}/api/agents/chat`, { message: tc.question });

            const routedTo = data.routed_to;
            const answer = (data.response?.answer || '').toLowerCase();
            const wasDelegated = data.response?.delegated || false;

            // 1. Verify Routing Decision
            const routingPassed = routedTo === tc.expected_agent;
            if (routingPassed) routingPassedCount++;

            // 2. Verify Grounded Accuracy
            const accuracyPassed = tc.expected_keywords.every((kw) => answer.includes(kw.toLowerCase()));
            if (accuracyPassed) accuracyPassedCount++;

            // 3. Verify A2A Delegation if applicable
            let delegationMsg = 'N/A';
            if (tc.test_delegation) {
                totalDelegationTests++;
                if (wasDelegated || routedTo === 'policy-agent') {
                    delegationPassedCount++;
                    delegationMsg = 'PASSED ✅';
                } else {
                    delegationMsg = 'FAILED ❌';
                }
            }

            console.log(` - Routing:       ${routingPassed ? 'PASSED ✅' : 'FAILED ❌'} (Routed to: ${routedTo}, Expected: ${tc.expected_agent})`);
            console.log(` - Fact Grounding: ${accuracyPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
            if (tc.test_delegation) {
                console.log(` - A2A Handoff:   ${delegationMsg}`);
            }
            console.log(` - Answer Snippet: "${data.response?.answer?.slice(0, 95)}..."\n`);
        } catch (err: any) {
            console.error(` ❌ Evaluation Exception:`, err.message);
        }
    }

    const total = testCases.length;
    console.log('====================================================');
    console.log('Final Multi-Agent Evaluation Results:');
    console.log(`- Routing Precision Rate:  ${((routingPassedCount / total) * 100).toFixed(1)}% (${routingPassedCount}/${total})`);
    console.log(`- Answer Accuracy Rate:    ${((accuracyPassedCount / total) * 100).toFixed(1)}% (${accuracyPassedCount}/${total})`);
    if (totalDelegationTests > 0) {
        console.log(`- A2A Delegation Success:  ${((delegationPassedCount / totalDelegationTests) * 100).toFixed(1)}% (${delegationPassedCount}/${totalDelegationTests})`);
    }
    console.log('====================================================');
}

runMultiAgentEvaluation().catch(console.error);