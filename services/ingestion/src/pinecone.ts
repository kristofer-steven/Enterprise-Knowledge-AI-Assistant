import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';

// --- Types ---
export type ChunkMetadata = RecordMetadata & {
    document_id: string;
    title: string;
    category: string;
    page: number;
    chunk_index: number;
    content: string;       // raw text — needed for retrieval in Week 2
};

export interface VectorToUpsert {
    id: string;            // e.g., "travel-policy#chunk-0"
    values: number[];      // the embedding vector
    metadata: ChunkMetadata;
}

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
