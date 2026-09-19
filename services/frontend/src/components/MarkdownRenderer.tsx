import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-2">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => <h1 className="text-base font-bold text-white mt-2 mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold text-white mt-2 mb-1">{children}</h2>,
                    p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-300">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-brand-300">{children}</strong>,
                    code: ({ children }) => (
                        <code className="px-1.5 py-0.5 rounded bg-surface-elevated text-brand-200 text-xs font-mono">
                            {children}
                        </code>
                    )
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
