'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { ChatMessage } from '@/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { SourceCitationCard } from '@/components/SourceCitationCard';

const SAMPLE_QUESTIONS = [
    'What is the maximum reimbursement for hotel in New York?',
    'How much is the initial home office equipment stipend?',
    'What are the core microservices and ports specified in our engineering architecture?',
    'Can you check the travel reimbursement limit for overseas lodging?'
];

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Hello! I am the **ACME Enterprise Knowledge AI Assistant**.\n\nI use multi-agent RAG to provide accurate, grounded answers from your company policies and engineering documents. How can I help you today?',
            timestamp: new Date().toLocaleTimeString(),
            routed_to: 'general'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (questionToSend?: string) => {
        const query = (questionToSend || input).trim();
        if (!query || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date().toLocaleTimeString()
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response?.answer || 'No answer generated.',
                timestamp: new Date().toLocaleTimeString(),
                routed_to: data.routed_to,
                routing_confidence: data.routing_confidence,
                routing_reason: data.routing_reason,
                sources: data.response?.sources || [],
                latency_ms: data.provenance?.total_latency_ms || data.client_latency_ms,
                model: data.provenance?.agent_model,
                delegated: data.response?.delegated
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `⚠️ **Request Error**: ${err.message}\n\nPlease verify that the query backend is running at http://localhost:3002.`,
                timestamp: new Date().toLocaleTimeString()
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-brand-400" />
                            </div>
                        )}

                        <div className={`max-w-2xl rounded-xl p-4 ${
                            msg.role === 'user'
                                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                                : 'glass-panel border border-white/5'
                        }`}>
                            {/* Metadata Pills for Assistant */}
                            {msg.role === 'assistant' && msg.routed_to && msg.routed_to !== 'general' && (
                                <div className="flex flex-wrap items-center gap-2 mb-3 pb-2.5 border-b border-white/5 text-[11px]">
                                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-medium">
                                        🤖 {msg.routed_to}
                                    </span>
                                    {msg.routing_confidence && (
                                        <span className="text-slate-400">
                                            Confidence: {(msg.routing_confidence * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    {msg.latency_ms && (
                                        <span className="flex items-center gap-1 text-slate-400 ml-auto">
                                            <Clock className="w-3 h-3" />
                                            {(msg.latency_ms / 1000).toFixed(2)}s
                                        </span>
                                    )}
                                </div>
                            )}

                            <MarkdownRenderer content={msg.content} />

                            {/* Citations List */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                                        <span>Grounded Sources ({msg.sources.length})</span>
                                        <span className="flex items-center gap-1 text-emerald-400">
                                            <ShieldCheck className="w-3 h-3" /> RAG Verified
                                        </span>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {msg.sources.slice(0, 4).map((c, i) => (
                                            <SourceCitationCard key={i} citation={c} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-slate-300" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3.5 items-start">
                        <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                            <RefreshCw className="w-4 h-4 text-brand-400 animate-spin" />
                        </div>
                        <div className="glass-panel rounded-xl p-4 text-xs text-slate-400 flex items-center space-x-2">
                            <span>Router Agent evaluating query & retrieving context...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Starters */}
            {messages.length <= 2 && (
                <div className="py-2 flex items-center gap-2 overflow-x-auto text-xs">
                    <span className="text-slate-400 shrink-0 font-medium">Try asking:</span>
                    {SAMPLE_QUESTIONS.map((q, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(q)}
                            className="shrink-0 px-3 py-1 rounded-full glass-panel hover:border-brand-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                        >
                            <span>{q}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                    ))}
                </div>
            )}

            {/* Chat Input Bar */}
            <div className="pt-2 border-t border-white/5">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about travel policy, expenses, remote work stipend, or tech architecture..."
                        disabled={isLoading}
                        className="w-full bg-surface-card border border-white/10 rounded-xl px-4 py-3.5 pr-14 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/60 transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-30 disabled:hover:bg-brand-600 transition-all"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
