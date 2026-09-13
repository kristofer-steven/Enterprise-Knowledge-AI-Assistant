import fs from 'fs';
import path from 'path';

interface TestCase {
    id: string;
    question: string;
    expected_answer_keywords: string[];
    expected_doc: string;
    expected_page: number;
}

async function fetchWithRetry(url: string, body: any, maxRetries = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const data = await response.json();
            if (data && data.success) {
                return data;
            }
            throw new Error(data?.error || 'Unsuccessful query response');
        } catch (err: any) {
            if (attempt === maxRetries) throw err;
            await new Promise((res) => setTimeout(res, 1500));
        }
    }
}

async function runEvaluation() {
    console.log('====================================================');
    console.log('     Enterprise RAG Evaluation & Accuracy Benchmark  ');
    console.log('====================================================\n');

    const evalPath = path.resolve(__dirname, '../evaluation/questions.json');
    const testCases: TestCase[] = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));

    let retrievalPassCount = 0;
    let answerPassCount = 0;

    for (const test of testCases) {
        console.log(`[Test ${test.id}] "${test.question}"`);

        let data: any = {};
        try {
            data = await fetchWithRetry('http://localhost:3002/api/chat', { message: test.question });
        } catch (err: any) {
            console.error(`  Query failed: ${err.message}`);
        }

        const answer = (data.answer || '').toLowerCase();
        const sources = data.sources || [];

        // 1. Evaluate Retrieval Citation
        let retrievalPassed = false;
        if (test.expected_doc === 'none') {
            retrievalPassed = sources.length === 0;
        } else {
            retrievalPassed = sources.some(
                (s: any) => s.document_id === test.expected_doc && s.page === test.expected_page
            );
        }

        // 2. Evaluate Answer Content Grounding
        const answerPassed = test.expected_doc === 'none'
            ? test.expected_answer_keywords.some((kw) => answer.includes(kw.toLowerCase()))
            : test.expected_answer_keywords.every((kw) => answer.includes(kw.toLowerCase()));

        if (retrievalPassed) retrievalPassCount++;
        if (answerPassed) answerPassCount++;

        console.log(` - Retrieval Citation Match: ${retrievalPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(` - Grounded Fact Match:      ${answerPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
        console.log(` - Answer Excerpt: "${data.answer?.slice(0, 90)}..."\n`);

        // Pacing delay (13s) to respect Gemini Free Tier 5 RPM limit
        await new Promise((res) => setTimeout(res, 13000));
    }

    const total = testCases.length;
    console.log('====================================================');
    console.log(`Final Results:`);
    console.log(`- Retrieval Recall Rate: ${((retrievalPassCount / total) * 100).toFixed(1)}% (${retrievalPassCount}/${total})`);
    console.log(`- Answer Accuracy Rate:  ${((answerPassCount / total) * 100).toFixed(1)}% (${answerPassCount}/${total})`);
    console.log('====================================================');
}

runEvaluation().catch(console.error);