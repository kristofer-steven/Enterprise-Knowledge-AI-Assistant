import { testConnection, upsertChunks, VectorToUpsert } from './pinecone';

async function runTest() {
    console.log('--- 1. Testing Pinecone Connection ---');
    const connected = await testConnection();

    if (!connected) {
        console.error('Failed to connect to Pinecone.');
        process.exit(1);
    }

    console.log('\n--- 2. Testing upsertChunks() ---');
    // Note: The index dimension is 1024
    const sampleVector: VectorToUpsert = {
        id: 'test-doc#chunk-0',
        values: new Array(1024).fill(0.01),
        metadata: {
            document_id: 'test-doc',
            title: 'Sample Test Document',
            category: 'test',
            page: 1,
            chunk_index: 0,
            content: 'This is a test document content to verify Pinecone upsert functionality.',
        },
    };

    try {
        const count = await upsertChunks([sampleVector]);
        console.log(`Successfully upserted ${count} record(s)!`);
        console.log('\n--- All Tests Passed! ---');
    } catch (error) {
        console.error('Failed to upsert chunks:', error);
        process.exit(1);
    }
}

runTest();
