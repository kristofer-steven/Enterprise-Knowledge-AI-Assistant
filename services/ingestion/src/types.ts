import { RecordMetadata } from '@pinecone-database/pinecone';

// ==========================================
// 1. Text Extraction Types
// ==========================================

export interface ExtractedPage {
    page: number;
    text: string;
}

export interface ExtractedDocument {
    text: string;
    pages: ExtractedPage[];
}

// ==========================================
// 2. Text Chunking Types
// ==========================================

export interface DocumentChunk {
    content: string;
    chunk_index: number;
    page: number;
}

export interface ChunkOptions {
    chunkSize?: number;    // default: 1000 characters
    chunkOverlap?: number; // default: 200 characters
}

// ==========================================
// 3. Embedding Types
// ==========================================

export interface EmbeddedChunk {
    chunk: DocumentChunk;
    vector: number[];
}

// ==========================================
// 4. Pinecone Vector & Metadata Types
// ==========================================

export type ChunkMetadata = RecordMetadata & {
    document_id: string;
    title: string;
    category: string;
    page: number;
    chunk_index: number;
    content: string;       // raw text — needed for retrieval in Week 2
};

export interface VectorToUpsert {
    id: string;            // deterministic ID: e.g. "travel-policy#chunk-0"
    values: number[];      // 1024-dimension embedding vector
    metadata: ChunkMetadata;
}

// ==========================================
// 5. API Request / Response Types (POST /api/ingest)
// ==========================================

export interface IngestRequestBody {
    title: string;
    category?: string;
}

export interface IngestSuccessResponse {
    success: true;
    document_id: string;
    title: string;
    chunks_count: number;
    status: 'indexed';
}

export interface IngestErrorResponse {
    success: false;
    error: string;
}

export type IngestResponse = IngestSuccessResponse | IngestErrorResponse;
