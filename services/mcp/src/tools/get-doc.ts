import { Pinecone } from '@pinecone-database/pinecone';
import { GetDocumentInput, DocumentDetailsOutput } from '../types.js';

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

export async function handleGetDocument(args: GetDocumentInput): Promise<DocumentDetailsOutput> {
    const pc = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX || 'knowledge-base';
    const index = pc.index(indexName);

    // Pinecone query using dummy vector with strict document_id filter
    // multilingual-e5-large uses 1024 dimensions
    const dummyVector = new Array(1024).fill(0.0001);

    const response = await index.query({
        vector: dummyVector,
        topK: 100, // Fetch up to 100 chunks for the document
        includeMetadata: true,
        filter: {
            document_id: { $eq: args.document_id }
        }
    });

    const matches = response.matches || [];
    if (matches.length === 0) {
        throw new Error(`Document with id '${args.document_id}' not found in knowledge base`);
    }

    // Sort chunks by page and ID to reconstruct sequential text
    const sortedChunks = matches.sort((a, b) => {
        const pageA = (a.metadata?.page as number) || 0;
        const pageB = (b.metadata?.page as number) || 0;
        if (pageA !== pageB) return pageA - pageB;
        return a.id.localeCompare(b.id);
    });

    const firstMeta = sortedChunks[0].metadata || {};
    const title = (firstMeta.title as string) || args.document_id;
    const category = (firstMeta.category as string) || 'general';

    // Collect distinct sections
    const sectionSet = new Set<string>();
    const fullTextParts: string[] = [];

    for (const chunk of sortedChunks) {
        const meta = chunk.metadata || {};
        const section = (meta.section as string) || '';
        if (section) sectionSet.add(section);

        const content = (meta.content as string) || '';
        if (content) {
            fullTextParts.push(`[Page ${meta.page || 1}${section ? ` - ${section}` : ''}]\n${content}`);
        }
    }

    return {
        document_id: args.document_id,
        title,
        category,
        total_chunks: sortedChunks.length,
        content: fullTextParts.join('\n\n---\n\n'),
        sections: Array.from(sectionSet)
    };
}
