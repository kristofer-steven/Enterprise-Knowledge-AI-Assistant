import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '.env')] });

import { Pinecone } from '@pinecone-database/pinecone';
import { RetrievedChunk, RetrievalOptions } from './types';

const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
});

const getIndex = () => {
    const indexName = process.env.PINECONE_INDEX_NAME || 'knowledge-base';
    return pc.index(indexName);
};

/**
 * Searches Pinecone for chunks semantically relevant to the user query.
 */
export async function retrieveRelevantChunks(
    query: string,
    options: RetrievalOptions = {}
): Promise<RetrievedChunk[]> {
    const topK = options.topK ?? Number(process.env.RAG_TOP_K || 5);
    const threshold = options.similarityThreshold ?? Number(process.env.RAG_SIMILARITY_THRESHOLD || 0.70);

    // 1. Generate query embedding using inputType: 'query'
    const embedResponse = await pc.inference.embed({
        model: 'multilingual-e5-large',
        inputs: [query],
        parameters: {
            inputType: 'query',
            truncate: 'END',
        },
    });

    const queryVector = (embedResponse.data[0] as any).values;
    if (!queryVector) {
        throw new Error('Failed to generate query embedding from Pinecone Inference.');
    }

    // 2. Build metadata filter if category filter is specified
    const filter = options.categoryFilter ? { category: { $eq: options.categoryFilter } } : undefined;

    // 3. Query Pinecone vector index
    const index = getIndex();
    const queryResponse = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter,
    });

    // 4. Map & Filter by similarity threshold
    const relevantChunks: RetrievedChunk[] = [];

    for (const match of queryResponse.matches || []) {
        const score = match.score ?? 0;
        if (score >= threshold && match.metadata) {
            relevantChunks.push({
                id: match.id,
                document_id: String(match.metadata.document_id || ''),
                title: String(match.metadata.title || ''),
                category: String(match.metadata.category || ''),
                page: Number(match.metadata.page || 1),
                chunk_index: Number(match.metadata.chunk_index || 0),
                content: String(match.metadata.content || ''),
                score,
            });
        }
    }

    return relevantChunks;
}