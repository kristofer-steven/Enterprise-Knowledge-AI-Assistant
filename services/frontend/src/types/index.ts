export interface SourceCitation {
    document: string;
    document_id: string;
    section: string;
    page: number;
    score: number;
    content?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    routed_to?: 'policy-agent' | 'knowledge-agent' | 'general';
    routing_confidence?: number;
    routing_reason?: string;
    sources?: SourceCitation[];
    latency_ms?: number;
    model?: string;
    delegated?: boolean;
}

export interface DocumentMetadata {
    id: string;
    filename: string;
    title: string;
    category: string;
    chunks_count: number;
    pages_count: number;
    created_at: string;
    file_size_kb: number;
}

export interface AgentDescriptor {
    id: string;
    name: string;
    role: string;
    domains: string[];
    capabilities: string[];
    status: 'active' | 'idle' | 'busy';
}

export interface TraceStep {
    id: string;
    name: string;
    type: 'router' | 'agent' | 'mcp' | 'vector' | 'llm';
    agent?: string;
    details: string;
    duration_ms: number;
    status: 'success' | 'warning' | 'error';
    data?: any;
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'offline';
    services: {
        frontend: boolean;
        query_service: boolean;
        ingestion_service: boolean;
        vector_db: boolean;
    };
    models: {
        current: string;
        available: string[];
    };
}