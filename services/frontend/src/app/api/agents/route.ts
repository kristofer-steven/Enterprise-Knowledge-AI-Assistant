import { NextResponse } from 'next/server';

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';

export async function GET() {
    try {
        const response = await fetch(`${QUERY_API_URL}/api/agents`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({
            agents: [
                {
                    id: 'router-agent',
                    name: 'Multi-Agent Router (Supervisor)',
                    role: 'Intent classification and dispatch',
                    domains: ['*']
                },
                {
                    id: 'policy-agent',
                    name: 'Corporate Policy Agent',
                    role: 'HR, Finance, Travel, Remote Work policy reasoning',
                    domains: ['finance', 'hr', 'travel']
                },
                {
                    id: 'knowledge-agent',
                    name: 'Technical Knowledge Agent',
                    role: 'Engineering architectures, IT, cybersecurity',
                    domains: ['engineering', 'security', 'architecture']
                }
            ]
        });
    }
}