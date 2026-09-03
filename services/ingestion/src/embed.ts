import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '../../.env'), path.resolve(process.cwd(), '.env')] });

import { Pinecone, DenseEmbedding } from '@pinecone-database/pinecone';
import { DocumentChunk, EmbeddedChunk } from './types';

// Initialize Pinecone client for Inference
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || '',
});

export { EmbeddedChunk };

/**
 * Generates embeddings for an array of DocumentChunk using Pinecone Inference.
 * 
 * @param chunks - Array of text chunks to embed
 * @param model - Model name (default: 'multilingual-e5-large', dimension 1024)
 * @returns Array of EmbeddedChunk containing the original chunk and its embedding vector
 */
export async function generateEmbeddings(
    chunks: DocumentChunk[],
    model: string = 'multilingual-e5-large'
): Promise<EmbeddedChunk[]> {
    if (chunks.length === 0) {
        return [];
    }

    const BATCH_SIZE = 96; // Pinecone Inference API recommended batch limit
    const results: EmbeddedChunk[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const inputs = batch.map((c) => c.content);

        const response = await pc.inference.embed({
            model,
            inputs,
            parameters: {
                inputType: 'passage',
                truncate: 'END',
            },
        });

        for (let j = 0; j < batch.length; j++) {
            const embeddingItem = response.data[j];
            const denseValues = (embeddingItem as DenseEmbedding).values;

            if (!denseValues) {
                throw new Error(`Failed to retrieve vector values for chunk ${batch[j].chunk_index}`);
            }

            results.push({
                chunk: batch[j],
                vector: denseValues,
            });
        }
    }

    return results;
}
