export interface RetrievedChunk {
    id: string;
    document_id: string;
    title: string;
    category: string;
    page: number;
    chunk_index: number;
    content: string;
    score: number;
}

export interface RetrievalOptions {
    topK?: number;
    similarityThreshold?: number;
    categoryFilter?: string;
}

export interface CitationSource {
    document_id: string;
    title: string;
    page: number;
    section?: string;
    score: number;
}

export interface ChatRequest {
    message: string;
    category?: string;
    topK?: number;
}

export interface ChatResponse {
    success: boolean;
    answer: string;
    sources: CitationSource[];
    retrieval_count: number;
    confidence: 'high' | 'medium' | 'low' | 'none';
}