import { PDFParse } from 'pdf-parse';
import { ExtractedPage, ExtractedDocument } from './types';

export { ExtractedPage, ExtractedDocument };

/**
 * Clean and normalize text extracted from PDF:
 * - Replaces CRLF with LF
 * - Removes excessive blank lines (more than 2 consecutive newlines)
 * - Normalizes redundant horizontal spaces and tabs
 * - Trims leading and trailing whitespace
 */
export function cleanText(rawText: string): string {
    return rawText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim();
}

/**
 * Extracts structured text and per-page content from a PDF Buffer.
 * 
 * @param pdfBuffer - Raw binary buffer of the PDF file
 * @returns Structured document with full text and page-by-page text
 */
export async function extractText(pdfBuffer: Buffer): Promise<ExtractedDocument> {
    const parser = new PDFParse({ data: pdfBuffer });

    try {
        const result = await parser.getText();

        const pages: ExtractedPage[] = result.pages.map((p) => ({
            page: p.num,
            text: cleanText(p.text),
        }));

        // Clean the full aggregated text
        const fullText = cleanText(
            pages.map((p) => p.text).filter((t) => t.length > 0).join('\n\n')
        );

        return {
            text: fullText,
            pages,
        };
    } finally {
        await parser.destroy();
    }
}