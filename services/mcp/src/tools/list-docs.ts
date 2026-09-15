import { Pinecone } from '@pinecone-database/pinecone';
import { ListDocumentsOutput, DocumentSummaryItem } from '../types.js';

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

export async function handleListDocuments(): Promise<ListDocumentsOutput> {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || 'knowledge-base';
    const index = pc.index(indexName);

    // Query across the index with a wide sample to discover documents
    const dummyVector = new Array(1024).fill(0.0001);

    const response = await index.query({
        vector: dummyVector,
        topK: 100,
        includeMetadata: true
    });

    const matches = response.matches || [];
    const docMap = new Map<string, { title: string; category: string; count: number }>();

    for (const match of matches) {
        const meta = match.metadata || {};
        const docId = (meta.document_id as string) || 'unknown';
        const title = (meta.title as string) || docId;
        const category = (meta.category as string) || 'general';

        if (!docMap.has(docId)) {
            docMap.set(docId, { title, category, count: 1 });
        } else {
            const entry = docMap.get(docId)!;
            entry.count += 1;
        }
    }

    const documents: DocumentSummaryItem[] = Array.from(docMap.entries()).map(([id, info]) => ({
        id,
        title: info.title,
        category: info.category,
        chunk_count: info.count
    }));

    return {
        total_documents: documents.length,
        documents
    };
}
