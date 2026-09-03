import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '../../.env'), path.resolve(process.cwd(), '.env')] });

import { Pinecone } from '@pinecone-database/pinecone';
import { ChunkMetadata, VectorToUpsert } from './types';

// Re-export types for consumers of pinecone.ts
export { ChunkMetadata, VectorToUpsert };

// --- Initialize Pinecone Client ---
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
});

// --- Get Index Reference ---
const getIndex = () => {
    const indexName = process.env.PINECONE_INDEX_NAME || 'knowledge-base';
    return pc.index<ChunkMetadata>(indexName);
};

// --- Upsert Function ---
export async function upsertChunks(vectors: VectorToUpsert[]): Promise<number> {
    const index = getIndex();
    const BATCH_SIZE = 100;  // Pinecone max per upsert call

    let totalUpserted = 0;

    // Split into batches of 100
    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
        const batch = vectors.slice(i, i + BATCH_SIZE);

        await index.upsert({
            records: batch,
        });

        totalUpserted += batch.length;
        console.log(`Upserted batch: ${totalUpserted}/${vectors.length}`);
    }

    return totalUpserted;
}

// --- Test Connection (optional utility) ---
export async function testConnection(): Promise<boolean> {
    try {
        const index = getIndex();
        const stats = await index.describeIndexStats();
        console.log('Pinecone connected. Index stats:', stats);
        return true;
    } catch (error) {
        console.error('Pinecone connection failed:', error);
        return false;
    }
}
