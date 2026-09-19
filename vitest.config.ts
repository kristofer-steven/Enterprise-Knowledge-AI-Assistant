import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 25000,
        include: [
            'services/**/__tests__/**/*.test.ts',
            'tests/**/*.test.ts'
        ],
        alias: {
            '@ingestion': path.resolve(__dirname, './services/ingestion/src'),
            '@query': path.resolve(__dirname, './services/query/src'),
            '@mcp': path.resolve(__dirname, './services/mcp/src')
        }
    }
});
