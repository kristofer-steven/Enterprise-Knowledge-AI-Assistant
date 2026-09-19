'use client';

import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, Layers, Calendar, HardDrive } from 'lucide-react';
import { DocumentMetadata } from '@/types';
import { DocumentUploadModal } from '@/components/DocumentUploadModal';

export default function DocumentsPage() {
    const [docs, setDocs] = useState<DocumentMetadata[]>([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const loadDocuments = async () => {
        try {
            const res = await fetch('/api/documents');
            const data = await res.json();
            if (data.documents) setDocs(data.documents);
        } catch (err) {
            console.error('Failed to load documents', err);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Enterprise Knowledge Base</h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Active documents indexed in Qdrant Vector Store and accessible via MCP tools.
                    </p>
                </div>
                <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all self-start"
                >
                    <Upload className="w-4 h-4" />
                    Upload New Document
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc) => (
                    <div key={doc.id} className="glass-panel rounded-xl p-5 border border-white/5 space-y-4 hover:border-brand-500/30 transition-all">
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Vector Indexed
                            </span>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm text-white">{doc.title}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.filename}</p>
                        </div>

                        <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-slate-500" />
                                <span>{doc.chunks_count} Chunks</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                                <span>{doc.file_size_kb} KB</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5 text-slate-500">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Category: {doc.category}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <DocumentUploadModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSuccess={loadDocuments}
            />
        </div>
    );
}
