import { retrieveRelevantChunks } from './retrieve';
import { generateGroundedAnswer } from './generate';

async function testGenerate() {
    const question = 'What are the rules and limits for international hotel reimbursement?';
    console.log(`Question: "${question}"\n`);

    console.log('Step 1: Retrieving chunks...');
    const chunks = await retrieveRelevantChunks(question);
    console.log(`Retrieved ${chunks.length} chunks.\n`);

    console.log('Step 2: Generating grounded answer with Gemini...');
    const result = await generateGroundedAnswer(question, chunks);

    console.log('=== AI Response ===');
    console.log(result.answer);
    console.log('\n=== Citations ===');
    console.log(JSON.stringify(result.sources, null, 2));
    console.log(`Confidence: ${result.confidence}`);
}

testGenerate().catch(console.error);