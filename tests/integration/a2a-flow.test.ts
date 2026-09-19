import { describe, it, expect } from 'vitest';

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';

describe('Full Multi-Agent Integration Flow', () => {
    it('should route travel query to policy-agent and return grounded citations', async () => {
        const response = await fetch(`${QUERY_API_URL}/api/agents/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'What is the maximum reimbursement for hotel in New York?' })
        });

        expect(response.status).toBe(200);
        const data = await response.json();

        expect(data.routed_to).toBe('policy-agent');
        expect(data.routing_confidence).toBeGreaterThanOrEqual(0.85);
        expect(data.response.answer.toLowerCase()).toContain('250');
        expect(data.response.sources.length).toBeGreaterThan(0);
        expect(data.response.sources[0].document_id).toBe('travel-policy');
    });

    it('should discover registered agents and their capability domains', async () => {
        const response = await fetch(`${QUERY_API_URL}/api/agents`);
        expect(response.status).toBe(200);
        const data = await response.json();

        expect(Array.isArray(data.agents)).toBe(true);
        const agentIds = data.agents.map((a: any) => a.id);
        expect(agentIds).toContain('policy-agent');
        expect(agentIds).toContain('knowledge-agent');
    });
});
