import { Pinecone } from '@pinecone-database/pinecone';
import { SearchDocumentsInput, SearchDocumentsOutput, SearchResultItem } from '../types.js';

let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY environment variable is not configured');
        }
        pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
}

export async function handleSearchDocuments(args: SearchDocumentsInput): Promise<SearchDocumentsOutput> {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || 'knowledge-base';
    const index = pc.index(indexName);

    const topK = args.top_k ?? 5;
    const threshold = args.threshold ?? 0.65;

    // 1. Generate query embedding using Pinecone Inference (asymmetric search)
    const embeddingResponse = await pc.inference.embed(
        'multilingual-e5-large',
        [args.query],
        { inputType: 'query', truncate: 'END' }
    );

    const queryVector = embeddingResponse.data[0]?.values;
    if (!queryVector || queryVector.length === 0) {
        throw new Error('Failed to generate query embedding vector');
    }

    // 2. Build metadata filter if category is supplied
    const filter = args.category ? { category: { $eq: args.category } } : undefined;

    // 3. Query Pinecone vector database
    const queryResponse = await index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter
    });

    const matches = queryResponse.matches || [];

    // 4. Map & filter results by similarity threshold
    const results: SearchResultItem[] = matches
        .filter((match) => (match.score ?? 0) >= threshold)
        .map((match) => {
            const meta = match.metadata || {};
            return {
                document: (meta.title as string) || (meta.document_id as string) || 'Unknown Document',
                document_id: (meta.document_id as string) || match.id,
                section: (meta.section as string) || 'General',
                page: (meta.page as number) || 1,
                content: (meta.content as string) || '',
                score: parseFloat((match.score ?? 0).toFixed(4))
            };
        });

    return {
        query: args.query,
        total_results: results.length,
        results
    };
}
