'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, Activity, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Navigation() {
    const pathname = usePathname();
    const [health, setHealth] = useState<'healthy' | 'degraded' | 'checking'>('checking');

    useEffect(() => {
        fetch('/api/health')
            .then((r) => r.json())
            .then((data) => setHealth(data.status))
            .catch(() => setHealth('degraded'));
    }, []);

    const navItems = [
        { href: '/', label: 'Assistant Chat', icon: Bot },
        { href: '/documents', label: 'Documents & Ingest', icon: FileText },
        { href: '/trace', label: 'Multi-Agent Trace', icon: Activity }
    ];

    return (
        <header className="sticky top-0 z-50 glass-panel border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 shadow-lg shadow-brand-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <Link href="/" className="font-semibold text-lg text-white tracking-tight flex items-center gap-2">
                            ACME Enterprise AI
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                                v1.0
                            </span>
                        </Link>
                        <p className="text-xs text-slate-400">RAG • MCP • A2A Multi-Agent System</p>
                    </div>
                </div>

                <nav className="flex items-center space-x-1 sm:space-x-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden md:flex items-center space-x-3 text-xs">
                    <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full glass-panel border border-white/5">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                health === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                            }`}
                        />
                        <span className="text-slate-300 capitalize">{health}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}