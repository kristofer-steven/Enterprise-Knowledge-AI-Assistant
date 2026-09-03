import { generateEmbeddings } from './embed';
import { DocumentChunk } from './chunk';

// Helper function to calculate cosine similarity between two numeric vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function testEmbedding() {
    console.log('=== Running Embedding Tests via Pinecone Inference ===\n');

    // Test cases: 2 semantically similar texts + 1 completely different topic
    const testChunks: DocumentChunk[] = [
        {
            chunk_index: 0,
            page: 1,
            content: 'Employees traveling domestically may claim hotel expenses up to 100 dollars per night.',
        },
        {
            chunk_index: 1,
            page: 1,
            content: 'The company provides reimbursement for hotel accommodations on domestic business trips.',
        },
        {
            chunk_index: 2,
            page: 2,
            content: 'Astronomers discovered a new exoplanet orbiting a distant red dwarf star in deep space.',
        },
    ];

    console.log('Input Texts:');
    testChunks.forEach((c) => console.log(` [${c.chunk_index}] "${c.content}"`));

    console.log('\n--- 1. Calling generateEmbeddings() ---');
    const results = await generateEmbeddings(testChunks);

    console.log(`Generated ${results.length} embeddings.`);

    // 1. Verify dimensions
    const expectedDim = 1024;
    for (const res of results) {
        if (!res.vector || res.vector.length !== expectedDim) {
            throw new Error(`Test Failed: Expected vector dimension ${expectedDim}, got ${res.vector?.length}`);
        }
    }
    console.log(`✔ Verification 1: All vectors have correct dimension (${expectedDim})`);

    // 2. Compute similarity
    const vecHotel1 = results[0].vector;
    const vecHotel2 = results[1].vector;
    const vecSpace = results[2].vector;

    const similaritySimilar = cosineSimilarity(vecHotel1, vecHotel2);
    const similarityDissimilar = cosineSimilarity(vecHotel1, vecSpace);

    console.log('\n--- 2. Semantic Similarity Check ---');
    console.log(`Similarity (Hotel Policy vs Hotel Reimbursement): ${similaritySimilar.toFixed(4)}`);
    console.log(`Similarity (Hotel Policy vs Astronomy Discovery): ${similarityDissimilar.toFixed(4)}`);

    if (similaritySimilar <= similarityDissimilar) {
        throw new Error(
            `Test Failed: Similar texts similarity (${similaritySimilar}) should be higher than dissimilar texts (${similarityDissimilar}).`
        );
    }

    console.log('✔ Verification 2: Semantically similar texts have significantly higher cosine similarity!');
    console.log('\n=== All Embedding Tests Passed Successfully! ===');
}

testEmbedding().catch((err) => {
    console.error('Embedding test failed:', err);
    process.exit(1);
});
