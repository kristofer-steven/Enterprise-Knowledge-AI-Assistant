import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: [path.resolve(__dirname, '../../../.env'), path.resolve(process.cwd(), '../../.env'), path.resolve(process.cwd(), '.env')] });

import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { extractText } from './extract';
import { chunkText } from './chunk';
import { generateEmbeddings } from './embed';
import { upsertChunks } from './pinecone';
import { VectorToUpsert, IngestRequestBody, IngestResponse } from './types';
import { slugify } from './utils';

const app = express();
const PORT = process.env.INGESTION_PORT || 3001;

app.use(express.json());

// --- Multer Configuration ---
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max limit
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('INVALID_FILE_TYPE'));
        }
        cb(null, true);
    },
});

// --- Routes ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/ingest', (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, async (err: any) => {
        // Handle Multer upload errors
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'File size exceeds the 10MB limit.',
                });
            }
            if (err.message === 'INVALID_FILE_TYPE') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid file type. Only PDF is supported.',
                });
            }
            return res.status(400).json({
                success: false,
                error: err.message || 'Error uploading file.',
            });
        }

        try {
            // 1. Validate file presence
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'PDF file is required.',
                });
            }

            // 2. Validate title
            const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
            if (!title) {
                return res.status(400).json({
                    success: false,
                    error: 'Title is required and cannot be empty.',
                });
            }

            const category = typeof req.body?.category === 'string' && req.body.category.trim() !== ''
                ? req.body.category.trim()
                : 'general';

            // 3. Generate document_id from title
            const document_id = slugify(title);

            // 4. Extract text from PDF buffer
            const extracted = await extractText(req.file.buffer);
            if (!extracted.text || extracted.pages.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Unable to extract text from the provided PDF.',
                });
            }

            // 5. Chunk extracted text
            const chunks = chunkText(extracted.pages);
            if (chunks.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Document produced no text chunks.',
                });
            }

            // 6. Generate embeddings for all chunks
            const embeddedChunks = await generateEmbeddings(chunks);

            // 7. Prepare Pinecone vectors
            const vectors: VectorToUpsert[] = embeddedChunks.map((ec) => ({
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

            // 8. Upsert vectors to Pinecone
            await upsertChunks(vectors);

            // 9. Return success response
            return res.status(200).json({
                success: true,
                document_id,
                title,
                chunks_count: vectors.length,
                status: 'indexed',
            });
        } catch (error: any) {
            console.error('Ingestion pipeline error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Internal server error during ingestion pipeline.',
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Ingestion service running on port ${PORT}`);
});
