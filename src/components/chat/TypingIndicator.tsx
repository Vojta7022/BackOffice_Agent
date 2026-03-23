'use client'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <div className="flex items-center gap-1.5">
        <span className="typing-dot" style={{ animationDelay: '0ms' }} />
        <span className="typing-dot" style={{ animationDelay: '150ms' }} />
        <span className="typing-dot" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-xs text-muted-foreground">RE:Agent přemýšlí…</span>
      <style>{`
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          animation: typing-bounce 1s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
