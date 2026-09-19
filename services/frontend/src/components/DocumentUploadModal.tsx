'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function DocumentUploadModal({
    isOpen,
    onClose,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Ingestion failed');

            setResult(data);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1800);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="glass-panel-elevated rounded-2xl w-full max-w-md p-6 border border-white/10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-lg font-semibold text-white mb-1">Upload Knowledge Document</h3>
                <p className="text-xs text-slate-400 mb-5">
                    Upload corporate policies or tech manuals to parse, chunk, and embed into Qdrant vector database.
                </p>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-brand-500/50 transition-all cursor-pointer">
                    <input
                        type="file"
                        accept=".pdf,.txt,.md"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="doc-upload-input"
                    />
                    <label htmlFor="doc-upload-input" className="cursor-pointer block">
                        <Upload className="w-8 h-8 text-brand-400 mx-auto mb-2" />
                        <span className="text-sm font-medium text-slate-200 block">
                            {file ? file.name : 'Click to browse or drop PDF file here'}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 block">Supports PDF, Markdown, Text (Max 15MB)</span>
                    </label>
                </div>

                {error && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {result && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Ingested successfully! {result.chunks_count || result.chunks?.length || 'Multiple'} chunks indexed.</span>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 rounded-lg text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {uploading ? 'Processing & Chunking...' : 'Start Ingestion'}
                    </button>
                </div>
            </div>
        </div>
    );
}
