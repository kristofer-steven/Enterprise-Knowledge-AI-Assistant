'use client';

import { useState } from 'react';
import { Activity, Play, Code } from 'lucide-react';
import { TraceDAG } from '@/components/TraceDAG';

export default function TracePage() {
    const [query, setQuery] = useState('What is the maximum reimbursement for hotel in New York?');
    const [isRunning, setIsRunning] = useState(false);
    const [traceData, setTraceData] = useState<any>(null);

    const executeTrace = async () => {
        setIsRunning(true);
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query })
            });
            const data = await res.json();
            setTraceData(data);
        } catch (err) {
            console.error('Trace error', err);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-brand-400" />
                    Multi-Agent RAG Trace & Observability
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                    Inspect end-to-end execution flow, router classification confidence, A2A delegation hops, and retrieval provenance.
                </p>
            </div>

            {/* Query Tester */}
            <div className="glass-panel rounded-xl p-4 border border-white/5 flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter query to trace..."
                    className="flex-1 bg-surface-card border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
                <button
                    onClick={executeTrace}
                    disabled={isRunning}
                    className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                    <Play className="w-3.5 h-3.5" />
                    {isRunning ? 'Tracing...' : 'Run Trace'}
                </button>
            </div>

            {traceData && (
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Visual DAG */}
                    <TraceDAG
                        routerAgent="router-agent"
                        targetAgent={traceData.routed_to || 'policy-agent'}
                        confidence={traceData.routing_confidence || 1.0}
                        retrievalCount={traceData.response?.sources?.length || 4}
                        latencyMs={traceData.provenance?.total_latency_ms || traceData.client_latency_ms || 2400}
                    />

                    {/* Raw JSON Payload Inspector */}
                    <div className="glass-panel rounded-xl p-4 border border-white/5 flex flex-col">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                                <Code className="w-4 h-4 text-brand-400" /> Raw Multi-Agent Response Payload
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">application/json</span>
                        </div>
                        <pre className="flex-1 overflow-auto p-3 rounded-lg bg-black/40 text-[11px] font-mono text-emerald-300/90 leading-relaxed max-h-96">
                            {JSON.stringify(traceData, null, 2)}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
