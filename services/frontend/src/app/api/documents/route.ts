import { NextResponse } from 'next/server';

const MCP_API_URL = process.env.MCP_API_URL || 'http://localhost:3003';

export async function GET() {
    try {
        // Query documents from MCP tools or fallback list
        const knownDocuments = [
            {
                id: 'travel-policy',
                filename: 'travel-policy.pdf',
                title: 'Corporate Travel & Lodging Policy',
                category: 'Finance / HR',
                chunks_count: 8,
                pages_count: 3,
                created_at: new Date().toISOString(),
                file_size_kb: 5.8
            },
            {
                id: 'remote-work-policy',
                filename: 'remote-work-policy.pdf',
                title: 'Global Remote Work & Stipend Guidelines',
                category: 'Human Resources',
                chunks_count: 12,
                pages_count: 3,
                created_at: new Date().toISOString(),
                file_size_kb: 6.2
            },
            {
                id: 'finance-policy',
                filename: 'finance-policy.pdf',
                title: 'Procurement & Financial Authorization Policy',
                category: 'Finance / Compliance',
                chunks_count: 10,
                pages_count: 2,
                created_at: new Date().toISOString(),
                file_size_kb: 6.1
            }
        ];

        return NextResponse.json({ documents: knownDocuments });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}