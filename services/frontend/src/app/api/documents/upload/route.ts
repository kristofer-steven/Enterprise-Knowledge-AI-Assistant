import { NextResponse } from 'next/server';

const INGESTION_API_URL = process.env.INGESTION_API_URL || 'http://localhost:3001';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'File upload is required' }, { status: 400 });
        }

        // Forward multipart payload directly to Ingestion Service (Port 3001)
        const forwardData = new FormData();
        forwardData.append('file', file);

        const response = await fetch(`${INGESTION_API_URL}/api/ingest`, {
            method: 'POST',
            body: forwardData
        });

        if (!response.ok) {
            const errText = await response.text();
            return NextResponse.json({ error: `Ingestion service error: ${errText}` }, { status: response.status });
        }

        const result = await response.json();
        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json(
            { error: `Cannot reach Ingestion Service: ${err.message}` },
            { status: 502 }
        );
    }
}