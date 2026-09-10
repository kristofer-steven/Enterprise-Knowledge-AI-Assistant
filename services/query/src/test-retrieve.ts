import { retrieveRelevantChunks } from './retrieve';

async function testRetrieval() {
    console.log('=== 1. Testing Retrieval with Relevant Query ===');
    const q1 = 'What is the maximum domestic hotel allowance per night?';
    console.log(`Query: "${q1}"`);
    const results1 = await retrieveRelevantChunks(q1);

    console.log(`Retrieved: ${results1.length} chunks`);
    results1.forEach((r, idx) => {
        console.log(`\n[#${idx + 1}] Score: ${r.score.toFixed(4)} | Doc: ${r.title} (Page ${r.page})`);
        console.log(`Content: "${r.content.slice(0, 120)}..."`);
    });

    console.log('\n=== 2. Testing Anti-Hallucination Guardrail (Irrelevant Query) ===');
    const q2 = 'What is the company policy regarding landing humans on Mars?';
    console.log(`Query: "${q2}"`);
    const results2 = await retrieveRelevantChunks(q2);

    console.log(`Retrieved chunks meeting threshold (>= 0.70): ${results2.length}`);
    if (results2.length === 0) {
        console.log('✔ Guardrail Passed: Irrelevant query returned 0 chunks (no hallucination context).');
    }
}

testRetrieval().catch(console.error);