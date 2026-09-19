import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
    title: 'Enterprise Knowledge AI Assistant',
    description: 'Autonomous multi-agent enterprise RAG assistant with grounded source citations and MCP tools.'
};

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="flex flex-col min-h-screen">
                <Navigation />
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </body>
        </html>
    );
}