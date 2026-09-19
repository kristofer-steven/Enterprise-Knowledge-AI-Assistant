import { describe, it, expect } from 'vitest';
import { SearchDocumentsInputSchema, GetDocumentInputSchema } from '../types.js';

describe('MCP Protocol Tool Input Schemas', () => {
    it('should accept valid search_documents input arguments', () => {
        const input = {
            query: 'overseas lodging reimbursement',
            top_k: 5,
            threshold: 0.75
        };

        const parsed = SearchDocumentsInputSchema.safeParse(input);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect(parsed.data.query).toBe('overseas lodging reimbursement');
            expect(parsed.data.top_k).toBe(5);
        }
    });

    it('should validate get_document input requiring document_id', () => {
        const input = { document_id: 'travel-policy' };
        const parsed = GetDocumentInputSchema.safeParse(input);
        expect(parsed.success).toBe(true);

        const invalid = {};
        const parsedInvalid = GetDocumentInputSchema.safeParse(invalid);
        expect(parsedInvalid.success).toBe(false);
    });
});
