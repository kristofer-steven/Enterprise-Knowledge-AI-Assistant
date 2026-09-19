import { NextResponse } from 'next/server';

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';
const INGESTION_API_URL = process.env.INGESTION_API_URL || 'http://localhost:3001';

export async function GET() {
    const checks = {
        frontend: true,
        query_service: false,
        ingestion_service: false,
        vector_db: true
    };

    try {
        const qRes = await fetch(`${QUERY_API_URL}/health`, { signal: AbortSignal.timeout(1500) });
        checks.query_service = qRes.ok;
    } catch { }

    try {
        const iRes = await fetch(`${INGESTION_API_URL}/health`, { signal: AbortSignal.timeout(1500) });
        checks.ingestion_service = iRes.ok;
    } catch { }

    const isHealthy = checks.query_service && checks.ingestion_service;

    return NextResponse.json({
        status: isHealthy ? 'healthy' : 'degraded',
        services: checks,
        model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
        timestamp: new Date().toISOString()
    });
}