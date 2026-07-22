import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

// ── icons ────────────────────────────────────────────────────────────────────
const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);
const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const BookIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);
const SpinnerIcon = () => (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="10" strokeOpacity={0.25} />
        <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
);

// ── greeting shown only when a document has no saved chat history ────────────
const GREETING_MESSAGE = {
    role: "assistant",
    content: "Hi! I've read your document. Ask me anything about it — I'll point you to the right page.",
    isGreeting: true,
};

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === "user";
    return (
        <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
            {!isUser && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-indigo-300">AI</span>
                </div>
            )}
            <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white/5 border border-white/8 text-slate-200 rounded-bl-sm"
                    }`}
            >
                {msg.content}
            </div>
        </div>
    );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
    return (
        <div className="flex gap-2 justify-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-300">AI</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
        </div>
    );
}

// ── PDF Viewer — renders the PDF natively via the browser's built-in viewer.
// Avoids routing the file through Google's docs.google.com/viewer, which
// leaked the (tokenized) file URL to Google on every open, double-downloaded
// the file (Cloudinary + Google), and broke behind firewalls that block
// Google services.
function PDFViewer({ fileUrl, fileName }) {
    if (!fileUrl) {
        return (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                <div className="text-center space-y-2">
                    <BookIcon />
                    <p>No PDF available</p>
                </div>
            </div>
        );
    }

    return (
        <object data={fileUrl} type="application/pdf" className="w-full h-full">
            {/* Fallback for browsers that can't render the <object> (e.g. some
                mobile browsers) — offer a direct link instead of a blank pane. */}
            <div className="h-full flex items-center justify-center text-slate-500 text-sm px-6">
                <div className="text-center space-y-3">
                    <BookIcon />
                    <p>Your browser can't preview PDFs inline.</p>
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                        Open "{fileName || "document"}" in a new tab
                    </a>
                </div>
            </div>
        </object>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChatPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [messages, setMessages] = useState([GREETING_MESSAGE]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // fetch document
    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await API.get(`/upload/${id}`);
                const docData = res.data.document || res.data;
                setDoc(docData);

                if (Array.isArray(docData.chatHistory) && docData.chatHistory.length > 0) {
                    setMessages(
                        docData.chatHistory.map((m) => ({
                            role: m.role,
                            content: m.content,
                        }))
                    );
                } else {
                    setMessages([GREETING_MESSAGE]);
                }
            } catch (err) {
                setError(err.response?.data?.message || err.message || "Failed to load document");
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [id]);

    // auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, sending]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || sending) return;

        const userMsg = { role: "user", content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setSending(true);

        // build history (exclude greeting, keep last 10 turns)
        const history = messages
            .filter((m) => !m.isGreeting)
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content }));

        try {
            const res = await API.post(`/chat/${id}`, {
                message: text,
                history,
            });

            const reply = res.data.reply || res.data.message || "No response.";
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || "Something went wrong.";
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ ${errMsg}` },
            ]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-screen bg-[#0d0f14] flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <SpinnerIcon />
                    <span className="text-sm">Loading document…</span>
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="h-screen bg-[#0d0f14] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-sm">{error}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="text-indigo-400 text-sm hover:text-indigo-300 underline"
                    >
                        ← Back to dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-screen bg-[#0d0f14] text-white flex flex-col overflow-hidden">

            {/* ── Top bar ── */}
            <header className="flex items-center gap-3 px-5 py-3 border-b border-white/8 bg-[#0d0f14]/80 backdrop-blur-sm flex-shrink-0">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm"
                >
                    <BackIcon />
                    Back
                </button>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 min-w-0">
                    <BookIcon />
                    <span className="text-sm font-medium text-slate-200 truncate">
                        {doc?.fileName || "Document"}
                    </span>
                </div>
            </header>

            {/* ── Split layout ── */}
            <div className="flex flex-1 min-h-0">

                {/* LEFT — Chat panel */}
                <div className="w-[42%] min-w-[320px] flex flex-col border-r border-white/8">

                    {/* messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {messages.map((msg, i) => (
                            <MessageBubble key={i} msg={msg} />
                        ))}
                        {sending && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* input */}
                    <div className="flex-shrink-0 px-4 py-4 border-t border-white/8 bg-[#0d0f14]">
                        <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-indigo-500/50 transition-colors">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about your document…"
                                rows={1}
                                className="flex-1 bg-transparent resize-none text-sm text-white placeholder-slate-500 outline-none leading-relaxed max-h-32 overflow-y-auto"
                                style={{ fieldSizing: "content" }}
                                disabled={sending}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || sending}
                                className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
                            >
                                {sending ? <SpinnerIcon /> : <SendIcon />}
                            </button>
                        </div>
                        <p className="text-center text-xs text-slate-600 mt-2">
                            Enter to send · Shift+Enter for new line
                        </p>
                    </div>
                </div>

                {/* RIGHT — Actual PDF rendered via iframe */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c10]">
                    <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/6 flex-shrink-0">
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                            Document
                        </span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <PDFViewer
                            fileUrl={doc?.fileUrl?.replace('/upload/', '/upload/fl_attachment:false/')}
                            fileName={doc?.fileName}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}