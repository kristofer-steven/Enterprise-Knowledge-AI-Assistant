import { ExtractedPage, DocumentChunk, ChunkOptions } from './types';

export { DocumentChunk, ChunkOptions };

/**
 * Splits extracted document pages into overlapping text chunks.
 *
 * @param pages - Array of extracted pages with page number and text
 * @param options - Chunk size and overlap configurations
 * @returns Array of DocumentChunk with content, chunk_index, and page
 */
export function chunkText(
    pages: ExtractedPage[],
    options: ChunkOptions = {}
): DocumentChunk[] {
    const chunkSize = options.chunkSize ?? 1000;
    const chunkOverlap = options.chunkOverlap ?? 200;

    const chunks: DocumentChunk[] = [];
    let globalIndex = 0;

    for (const pageItem of pages) {
        const text = pageItem.text.trim();
        if (!text) continue;

        // If page text is smaller than or equal to chunkSize, emit directly
        if (text.length <= chunkSize) {
            chunks.push({
                content: text,
                chunk_index: globalIndex++,
                page: pageItem.page,
            });
            continue;
        }

        // Split with overlap
        let start = 0;
        while (start < text.length) {
            let end = start + chunkSize;

            if (end < text.length) {
                // Find cleanest delimiter to break on
                const window = text.slice(start, end);
                const lastParagraph = window.lastIndexOf('\n\n');
                const lastNewline = window.lastIndexOf('\n');
                const lastSentence = window.lastIndexOf('. ');
                const lastSpace = window.lastIndexOf(' ');

                let breakPoint = -1;
                const minBreak = Math.floor(chunkSize * 0.6);

                if (lastParagraph >= minBreak) {
                    breakPoint = lastParagraph + 2;
                } else if (lastNewline >= minBreak) {
                    breakPoint = lastNewline + 1;
                } else if (lastSentence >= minBreak) {
                    breakPoint = lastSentence + 2;
                } else if (lastSpace >= minBreak) {
                    breakPoint = lastSpace + 1;
                }

                if (breakPoint > 0) {
                    end = start + breakPoint;
                }
            }

            const chunkContent = text.slice(start, end).trim();
            if (chunkContent.length > 0) {
                chunks.push({
                    content: chunkContent,
                    chunk_index: globalIndex++,
                    page: pageItem.page,
                });
            }

            const step = Math.max(1, (end - start) - chunkOverlap);
            start += step;
        }
    }

    return chunks;
}
