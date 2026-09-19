import { describe, it, expect } from 'vitest';
import { chunkText } from '../chunk.js';
import { ExtractedPage } from '../types.js';

describe('Document Chunker & Preprocessor Unit Tests', () => {
    it('should split long document content into overlapping chunks within token limits', () => {
        const sampleText = `
            Section 1: General Principles
            All business travel must be pre-approved by the department manager.
            Employees must use the corporate booking portal whenever possible.
            
            Section 2: Lodging Allowances
            For domestic Tier-1 cities such as New York and San Francisco,
            the maximum allowable lodging rate is $250 per night before local taxes.
            For international destinations, the standard rate is $280 per night.
        `.repeat(6);

        const pages: ExtractedPage[] = [
            { page: 1, text: sampleText }
        ];

        const chunks = chunkText(pages, { chunkSize: 250, chunkOverlap: 50 });

        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks[0].chunk_index).toBe(0);
        expect(chunks[0].page).toBe(1);
        expect(chunks[0].content.length).toBeGreaterThan(50);
    });

    it('should preserve page numbering and small content intact', () => {
        const pages: ExtractedPage[] = [
            { page: 2, text: 'Home office setup stipend is $800 one-time non-taxable reimbursement.' }
        ];

        const chunks = chunkText(pages, { chunkSize: 500, chunkOverlap: 50 });

        expect(chunks.length).toBe(1);
        expect(chunks[0].page).toBe(2);
        expect(chunks[0].content).toContain('$800');
    });
});
