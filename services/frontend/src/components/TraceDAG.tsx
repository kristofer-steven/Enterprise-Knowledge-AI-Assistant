import { ArrowDown, Bot, Database, Sparkles, Cpu, ShieldCheck } from 'lucide-react';

export function TraceDAG({
    routerAgent,
    targetAgent,
    confidence,
    retrievalCount,
    latencyMs
}: {
    routerAgent: string;
    targetAgent: string;
    confidence: number;
    retrievalCount: number;
    latencyMs: number;
}) {
    return (
        <div className="glass-panel rounded-xl p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-white mb-2">Execution DAG & Pipeline Cascade</h3>

            <div className="flex flex-col items-center space-y-2 text-xs">
                {/* Step 1: User Request */}
                <div className="w-full max-w-md p-3 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-400" />
                        <span className="font-medium text-slate-200">1. User Natural Language Query</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">Client Ingress</span>
                </div>

                <ArrowDown className="w-4 h-4 text-slate-500" />

                {/* Step 2: Router Agent */}
                <div className="w-full max-w-md p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-brand-400" />
                        <div>
                            <span className="font-medium text-white block">2. Supervisor Router ({routerAgent})</span>
                            <span className="text-[10px] text-brand-300">Confidence: {(confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-200 text-[10px] font-mono">
                        Structured JSON
                    </span>
                </div>

                <ArrowDown className="w-4 h-4 text-slate-500" />

                {/* Step 3: Domain Specialist Agent */}
                <div className="w-full max-w-md p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <div>
                            <span className="font-medium text-white block">3. Specialist Agent: {targetAgent}</span>
                            <span className="text-[10px] text-indigo-300">A2A Standard Protocol</span>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 text-[10px] font-mono">
                        Handoff
                    </span>
                </div>

                <ArrowDown className="w-4 h-4 text-slate-500" />

                {/* Step 4: Vector Retrieval & MCP */}
                <div className="w-full max-w-md p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <div>
                            <span className="font-medium text-white block">4. Qdrant / MCP: search_documents()</span>
                            <span className="text-[10px] text-emerald-300">{retrievalCount} candidate chunks retrieved</span>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-mono">
                        RAG Top-K
                    </span>
                </div>

                <ArrowDown className="w-4 h-4 text-slate-500" />

                {/* Step 5: Synthesis */}
                <div className="w-full max-w-md p-3 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-400" />
                        <div>
                            <span className="font-medium text-white block">5. Grounded Synthesis & Citations</span>
                            <span className="text-[10px] text-slate-400">Total Latency: {(latencyMs / 1000).toFixed(2)}s</span>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">
                        200 OK
                    </span>
                </div>
            </div>
        </div>
    );
}
