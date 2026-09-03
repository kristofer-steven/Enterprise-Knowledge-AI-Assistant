import { chunkText, DocumentChunk } from './chunk';
import { ExtractedPage } from './extract';

function testChunking() {
    console.log('=== Running Chunking Tests ===\n');

    // Sample multi-page input with paragraph boundaries
    const samplePages: ExtractedPage[] = [
        {
            page: 1,
            text: [
                'Welcome to the corporate handbook. This is chapter one covering company culture and workplace ethics.',
                'Employees are expected to maintain professional behavior at all times during business hours.',
                'Collaboration, integrity, and innovation are the core pillars that guide our daily operations.',
                'When interacting with clients or external stakeholders, always represent the organization with utmost respect.',
                'Regular feedback sessions with managers will help assess personal growth and team objectives.'
            ].join('\n\n'),
        },
        {
            page: 2,
            text: [
                'Chapter two covers operational procedures and reporting mechanisms.',
                'All project milestones must be tracked in the central project management software weekly.',
                'Budget approvals exceeding one thousand dollars require executive committee sign-off.',
                'Incident reports must be submitted within twenty-four hours of occurrence to the compliance team.'
            ].join('\n\n'),
        },
    ];

    const chunkSize = 250;
    const chunkOverlap = 50;

    console.log(`Input: 2 pages, total chars: ${samplePages[0].text.length + samplePages[1].text.length}`);
    console.log(`Configuration: chunkSize=${chunkSize}, chunkOverlap=${chunkOverlap}\n`);

    const chunks: DocumentChunk[] = chunkText(samplePages, { chunkSize, chunkOverlap });

    console.log(`Total Chunks Generated: ${chunks.length}\n`);

    // 1. Verify chunk count > 0
    if (chunks.length === 0) {
        throw new Error('Test Failed: Expected chunks to be generated, but got 0.');
    }

    // 2. Verify chunk indexes are sequential
    for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].chunk_index !== i) {
            throw new Error(`Test Failed: Chunk index mismatch at index ${i}, found ${chunks[i].chunk_index}`);
        }
    }
    console.log('✔ Verification 1: Chunk indices are continuous and 0-indexed (0 to ' + (chunks.length - 1) + ')');

    // 3. Verify page assignments
    const page1Chunks = chunks.filter((c) => c.page === 1);
    const page2Chunks = chunks.filter((c) => c.page === 2);
    if (page1Chunks.length === 0 || page2Chunks.length === 0) {
        throw new Error('Test Failed: Chunks did not properly preserve page 1 and page 2 mapping.');
    }
    console.log(`✔ Verification 2: Page tracking preserved (Page 1: ${page1Chunks.length} chunks, Page 2: ${page2Chunks.length} chunks)`);

    // 4. Verify overlap between consecutive chunks on the same page
    let overlapFound = false;
    for (let i = 0; i < page1Chunks.length - 1; i++) {
        const curr = page1Chunks[i].content;
        const next = page1Chunks[i + 1].content;
        // Check if the end of current chunk shares words/characters with start of next chunk
        const suffix = curr.slice(-30).trim();
        const words = suffix.split(' ').filter(Boolean);
        const lastWord = words[words.length - 1];
        if (next.includes(lastWord)) {
            overlapFound = true;
            break;
        }
    }
    if (!overlapFound) {
        throw new Error('Test Failed: Expected overlap between consecutive chunks on Page 1.');
    }
    console.log('✔ Verification 3: Overlap is present between consecutive chunks');

    // Print chunks preview
    console.log('\n--- Chunks Preview ---');
    chunks.forEach((c) => {
        console.log(`[Chunk #${c.chunk_index} | Page ${c.page} | ${c.content.length} chars]:`);
        console.log(`"${c.content.slice(0, 60)}..."\n`);
    });

    console.log('=== All Chunking Tests Passed Successfully! ===');
}

testChunking();
