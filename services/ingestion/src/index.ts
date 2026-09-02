import express from 'express';

const app = express();
const PORT = process.env.INGESTION_PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.post('/api/ingest', (req, res) => {
    res.json({ message: 'not implemented yet' });
});

app.listen(PORT, () => {
    console.log(`Ingestion service running on port ${PORT}`);
});
