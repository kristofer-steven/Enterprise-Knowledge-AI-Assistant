import { Sparkles, Bot, FileText, Activity } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center space-y-6">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/25">
                <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>

            <div className="space-y-2 max-w-xl">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                    Enterprise Knowledge AI Assistant
                </h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Production-grade Multi-Agent System featuring RAG, MCP tool access,
                    and standardized Agent-to-Agent (A2A) orchestration.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                <Link
                    href="/"
                    className="glass-panel p-5 rounded-xl border border-white/5 hover:border-brand-500/40 transition-all text-left group"
                >
                    <div className="p-2 w-fit rounded-lg bg-brand-500/10 text-brand-400 mb-3 group-hover:scale-105 transition-transform">
                        <Bot className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Assistant Chat</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Interact with Policy & Knowledge specialist agents.
                    </p>
                </Link>

                <Link
                    href="/documents"
                    className="glass-panel p-5 rounded-xl border border-white/5 hover:border-brand-500/40 transition-all text-left group"
                >
                    <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Documents</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Browse indexed policies and upload documents.
                    </p>
                </Link>

                <Link
                    href="/trace"
                    className="glass-panel p-5 rounded-xl border border-white/5 hover:border-brand-500/40 transition-all text-left group"
                >
                    <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                        <Activity className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-white">Multi-Agent Trace</h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Inspect routing decisions, confidence, and A2A hops.
                    </p>
                </Link>
            </div>
        </div>
    );
}
