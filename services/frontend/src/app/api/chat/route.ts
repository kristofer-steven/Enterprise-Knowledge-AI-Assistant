import { NextResponse } from 'next/server';

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json({ error: 'Valid query message is required.' }, { status: 400 });
        }

        const startTime = Date.now();
        const response = await fetch(`${QUERY_API_URL}/api/agents/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Query service responded with HTTP ${response.status}: ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        const clientLatency = Date.now() - startTime;

        return NextResponse.json({
            ...data,
            client_latency_ms: clientLatency
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: `Failed to connect to Multi-Agent Query Service: ${err.message}` },
            { status: 502 }
        );
    }
}