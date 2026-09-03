import fs from 'fs';
import path from 'path';
import { extractText } from './extract';
import { chunkText } from './chunk';
import { generateEmbeddings } from './embed';
import { upsertChunks, VectorToUpsert } from './pinecone';
import { slugify } from './utils';

async function testFullPipeline() {
    console.log('=== 1. Reading Test PDF ===');
    const pdfPath = path.resolve(__dirname, '../../../sample-docs/test.pdf');
    const buffer = fs.readFileSync(pdfPath);
    console.log(`Loaded PDF (${buffer.length} bytes)`);

    console.log('\n=== 2. Extracting Text ===');
    const extracted = await extractText(buffer);
    console.log(`Extracted ${extracted.pages.length} pages, total ${extracted.text.length} chars.`);

    console.log('\n=== 3. Chunking Text ===');
    const chunks = chunkText(extracted.pages, { chunkSize: 500, chunkOverlap: 100 });
    console.log(`Generated ${chunks.length} chunks:`);
    chunks.forEach((c) => {
        console.log(` - Chunk #${c.chunk_index} (Page ${c.page}): "${c.content.slice(0, 40)}..." [${c.content.length} chars]`);
    });

    console.log('\n=== 4. Generating Embeddings via Pinecone Inference ===');
    const embedded = await generateEmbeddings(chunks);
    console.log(`Successfully generated ${embedded.length} vector embeddings (Dimension: ${embedded[0].vector.length})`);

    console.log('\n=== 5. Preparing Pinecone Vectors ===');
    const title = 'Travel Policy';
    const document_id = slugify(title);
    const category = 'policy';

    const vectors: VectorToUpsert[] = embedded.map((ec) => ({
        id: `${document_id}#chunk-${ec.chunk.chunk_index}`,
        values: ec.vector,
        metadata: {
            document_id,
            title,
            category,
            page: ec.chunk.page,
            chunk_index: ec.chunk.chunk_index,
            content: ec.chunk.content,
        },
    }));
    console.log(`Prepared ${vectors.length} vectors. First ID: "${vectors[0].id}"`);

    console.log('\n=== 6. Upserting to Pinecone ===');
    const totalUpserted = await upsertChunks(vectors);
    console.log(`Upsert completed: ${totalUpserted} vectors indexed into Pinecone!`);

    console.log('\n=== Pipeline Verification Succeeded! ===');
}

testFullPipeline().catch((err) => {
    console.error('Pipeline test failed:', err);
    process.exit(1);
});
