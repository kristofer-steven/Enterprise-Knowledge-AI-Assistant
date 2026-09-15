import { z } from 'zod';

// ==========================================
// Tool Input Schemas (Zod)
// ==========================================

export const SearchDocumentsInputSchema = z.object({
    query: z.string().min(1, 'Query cannot be empty').describe('Natural language search query across knowledge documents'),
    top_k: z.number().int().min(1).max(20).optional().default(5).describe('Maximum number of relevant chunks to return (default: 5)'),
    category: z.string().optional().describe('Optional category filter (e.g. "finance", "hr", "engineering")'),
    threshold: z.number().min(0).max(1).optional().default(0.65).describe('Minimum similarity score threshold (default: 0.65)')
});

export type SearchDocumentsInput = z.infer<typeof SearchDocumentsInputSchema>;

export const GetDocumentInputSchema = z.object({
    document_id: z.string().min(1, 'document_id is required').describe('Unique identifier of the document (e.g. "travel-policy")')
});

export type GetDocumentInput = z.infer<typeof GetDocumentInputSchema>;

export const ListDocumentsInputSchema = z.object({});

export type ListDocumentsInput = z.infer<typeof ListDocumentsInputSchema>;

// ==========================================
// Tool Output Interfaces
// ==========================================

export interface SearchResultItem {
    document: string;
    document_id: string;
    section: string;
    page: number;
    content: string;
    score: number;
}

export interface SearchDocumentsOutput {
    query: string;
    total_results: number;
    results: SearchResultItem[];
}

export interface DocumentDetailsOutput {
    document_id: string;
    title: string;
    category: string;
    total_chunks: number;
    content: string;
    sections: string[];
}

export interface DocumentSummaryItem {
    id: string;
    title: string;
    category: string;
    chunk_count: number;
}

export interface ListDocumentsOutput {
    total_documents: number;
    documents: DocumentSummaryItem[];
}
