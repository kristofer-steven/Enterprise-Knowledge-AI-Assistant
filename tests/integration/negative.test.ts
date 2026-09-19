import { describe, it, expect } from 'vitest';

const QUERY_API_URL = process.env.QUERY_API_URL || 'http://localhost:3002';

describe('Hallucination Defense & Negative Testing', () => {
    it('should gracefully decline questions not present in the corporate knowledge base', async () => {
        const outOfScopeQuery = 'What is the company discount for purchasing SpaceX rocket tickets?';

        const response = await fetch(`${QUERY_API_URL}/api/agents/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: outOfScopeQuery })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        const answer = (data.response?.answer || '').toLowerCase();

        // Must decline or state absence of information rather than hallucinating discounts
        const indicatesAbsence =
            answer.includes('not available') ||
            answer.includes('not found') ||
            answer.includes('does not contain') ||
            answer.includes('no information') ||
            answer.includes('unavailable');

        expect(indicatesAbsence).toBe(true);
        expect(answer).not.toContain('50%');
        expect(answer).not.toContain('discount code');
    });
});
