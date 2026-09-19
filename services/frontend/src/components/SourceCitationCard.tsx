'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { SourceCitation } from '@/types';

export function SourceCitationCard({ citation }: { citation: SourceCitation }) {
    const [expanded, setExpanded] = useState(false);
    const scorePct = Math.round(citation.score * 100);

    return (
        <div className="rounded-lg bg-surface-elevated/60 border border-white/5 p-3 hover:border-brand-500/30 transition-all text-xs">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center space-x-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="font-medium text-slate-200 truncate">{citation.document}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400 shrink-0">
                        Page {citation.page} • Sec: {citation.section}
                    </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-medium flex items-center gap-1 ${
                            scorePct >= 80
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                        }`}
                    >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {scorePct}% match
                    </span>
                    {expanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
                </div>
            </div>

            {expanded && citation.content && (
                <div className="mt-2.5 pt-2 border-t border-white/5 text-slate-400 text-[11px] leading-relaxed font-mono bg-black/20 p-2 rounded">
                    &ldquo;{citation.content}&rdquo;
                </div>
            )}
        </div>
    );
}
