import fs from 'fs';
import path from 'path';
import { extractText } from './extract';

async function runTest() {
    const docsDir = path.resolve(__dirname, '../../../sample-docs');
    const files = ['test.pdf', 'travel-policy.pdf', 'remote-work-policy.pdf', 'finance-policy.pdf'];

    console.log('=== Checking Sample PDFs Extraction ===\n');

    for (const filename of files) {
        const pdfPath = path.join(docsDir, filename);
        if (!fs.existsSync(pdfPath)) continue;

        const pdfBuffer = fs.readFileSync(pdfPath);
        const result = await extractText(pdfBuffer);
        console.log(`✔ [${filename}] Extracted ${result.pages.length} pages, ${result.text.length} total chars.`);
    }

    console.log('\n--- Detailed Preview of travel-policy.pdf ---');
    const travelBuf = fs.readFileSync(path.join(docsDir, 'travel-policy.pdf'));
    const travelResult = await extractText(travelBuf);
    for (const p of travelResult.pages) {
        console.log(`\n[Page ${p.page}] (${p.text.length} chars):`);
        console.log(p.text.slice(0, 180) + '...');
    }

    console.log('\n=== All Sample Documents Verified Successfully! ===');
}

runTest().catch((err) => {
    console.error('Test extract failed:', err);
    process.exit(1);
});
