import { describe, it, expect } from 'vitest';
import { RouterClassificationSchema } from '../agents/types.js';

describe('Router Agent Intent Schema & Decision Tests', () => {
    it('should validate conforming RouterClassification schema payload', () => {
        const validPayload = {
            target_agent: 'policy-agent',
            confidence: 0.98,
            category: 'finance',
            reasoning: 'The inquiry concerns hotel reimbursement limits under corporate policy.'
        };

        const parsed = RouterClassificationSchema.safeParse(validPayload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.target_agent).toBe('policy-agent');
            expect(parsed.data.confidence).toBeGreaterThanOrEqual(0.85);
        }
    });

    it('should reject invalid agent identifier', () => {
        const invalidPayload = {
            target_agent: 'unknown-agent-xyz',
            confidence: 0.5,
            category: 'general',
            reasoning: 'Inquiry is ambiguous.'
        };

        const parsed = RouterClassificationSchema.safeParse(invalidPayload);
        expect(parsed.success).toBe(false);
    });
});
