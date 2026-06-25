import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api.js";

const TOOLS = [
  { id: "chat", icon: "💬", title: "Chat with PDF", desc: "Ask anything, get answers sourced from your document.", bg: "bg-blue-50" },
  { id: "quiz", icon: "📝", title: "Smart Quiz", desc: "Auto-generate MCQs from any chapter.", bg: "bg-amber-50" },
  { id: "flashcards", icon: "🃏", title: "Flashcards", desc: "Key concepts distilled into bite-sized cards.", bg: "bg-green-50" },
  { id: "summary", icon: "📊", title: "Summary", desc: "Cut through dense text in under 10 seconds.", bg: "bg-purple-50" },
  { id: "notes", icon: "✨", title: "Generate Notes", desc: "Turn raw PDF text into structured, topic-wise notes.", bg: "bg-orange-50" },
];

const formatDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [activeToolId, setActiveToolId] = useState(null);
  const [toast, setToast] = useState(null);

  const selectedDoc = documents.find(d => d._id === selectedDocId) || null;

  const filteredDocs = documents.filter(d =>
    d.fileName.toLowerCase().includes(search.trim().toLowerCase())
  );

  useEffect(() => { fetchDocuments(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data } = await API.get("/upload");
      setDocuments(data.documents || []);
    } catch (err) {
      if (err.response?.status === 401) { navigate("/login"); return; }
      setToast({ type: "error", msg: err.response?.data?.message || err.message });
    } finally {
      setLoadingDocs(false);
    }
  };

  const processUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setToast({ type: "error", msg: "Only PDF files are supported." });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const { data } = await API.post("/upload", formData);
      setToast({ type: "success", msg: `"${file.name}" uploaded successfully.` });
      fetchDocuments();
    } catch (err) {
      setToast({ type: "error", msg: err.response?.data?.message || "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    processUpload(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processUpload(e.dataTransfer.files?.[0]);
  };

  const handleDelete = async (doc, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${doc.fileName}"? This can't be undone.`)) return;
    try {
      await API.delete(`/upload/${doc._id}`);
      setDocuments(prev => prev.filter(d => d._id !== doc._id));
      if (selectedDocId === doc._id) setSelectedDocId(null);
      setToast({ type: "success", msg: `"${doc.fileName}" deleted.` });
    } catch (err) {
      setToast({ type: "error", msg: err.message || "Couldn't delete file." });
    }
  };

  const handleLogout = async () => {
    try {
      await API.delete("/users/logout");
    } catch { /* noop */ }
    setDocuments([]);
    setSelectedDocId(null);
    navigate("/login");
  };

  const handleToolClick = (tool) => {
    setActiveToolId(tool.id);
    if (!selectedDoc) {
      setToast({ type: "warn", msg: "Select a document on the right, then pick a tool." });
      return;
    }
    if(tool.id === 'chat') {
      navigate(`/chat/${selectedDoc._id}`, {state : { doc: selectedDoc } });
      return;
    }
    setToast({ type: "info", msg: `Opening ${tool.title} for "${selectedDoc.fileName}" — coming soon!` });
  };

  if (loadingDocs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-offwhite">
        <div className="w-10 h-10 rounded-full border-4 border-blue/20 border-t-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-offwhite dot-bg">

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 h-[66px] flex items-center justify-between px-[5%] bg-white/95 backdrop-blur-xl shadow-[0_1px_20px_rgba(10,22,40,0.07)] border-b border-slate-100">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-blue to-blue-dark flex items-center justify-center text-lg leading-none">📚</div>
          <span className="font-syne font-extrabold text-[22px] text-navy">Saarthi</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100">
          <span className="w-1.5 h-1.5 rounded-full bg-blue" />
          <span className="font-inter text-[12.5px] text-blue-700 font-medium">
            {loadingDocs ? "Loading…" : `${documents.length} document${documents.length === 1 ? "" : "s"} saved`}
          </span>
        </div>

        <button onClick={handleLogout}
          className="px-5 py-2 rounded-[10px] border border-slate-200 font-syne font-semibold text-[14px] text-navy bg-white hover:border-red-300 hover:text-red-600 transition-all duration-200">
          Logout
        </button>
      </nav>

      {/* ── HEADER + SEARCH ── */}
      <div className="px-[5%] pt-9 pb-7 bg-white border-b border-slate-100">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h1 className="font-syne font-extrabold text-[28px] text-navy">Your Study Space</h1>
            <p className="font-inter text-[14px] text-slate-500 mt-1">Pick a document, choose a tool, start learning.</p>
          </div>

          <div className="relative w-full md:w-[360px] shrink-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none text-slate-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your documents…"
              className="s-input"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SPLIT SCREEN ── */}
      <div className="px-[5%] py-10 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">

          {/* ── LHS — Study tools ── */}
          <div>
            <p className="font-syne font-bold text-[12px] tracking-widest text-blue mb-4">STUDY TOOLS</p>

            {selectedDoc ? (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 mb-5">
                <span className="text-base leading-none">📄</span>
                <span className="font-inter text-[13px] text-blue-700 truncate min-w-0">
                  Working on <strong className="font-semibold">{selectedDoc.fileName}</strong>
                </span>
                <button onClick={() => setSelectedDocId(null)}
                  className="ml-auto shrink-0 bg-transparent border-none cursor-pointer text-blue-400 hover:text-blue-700 text-sm">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                <span className="text-base leading-none">👉</span>
                <span className="font-inter text-[13px] text-amber-700">Select a document on the right to get started</span>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {TOOLS.map(t => {
                const active = activeToolId === t.id && selectedDoc;
                return (
                  <button key={t.id} onClick={() => handleToolClick(t)}
                    className={`group w-full flex items-center gap-4 text-left bg-white rounded-2xl p-5 border-[1.5px] transition-all duration-250 cursor-pointer
                            ${active
                        ? "border-blue shadow-[0_12px_32px_rgba(37,99,235,0.14)] -translate-y-0.5"
                        : "border-slate-100 hover:border-blue-100 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(10,22,40,0.08)]"}`}>
                    <div className={`w-12 h-12 rounded-xl ${t.bg} flex items-center justify-center text-xl shrink-0`}>{t.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-syne font-bold text-[15px] text-navy">{t.title}</h3>
                      <p className="font-inter text-[12.5px] text-slate-500 mt-0.5 truncate">{t.desc}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-blue transition-colors duration-200 shrink-0">→</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RHS — Documents ── */}
          <div>
            <div className="flex items-center justify-between mb-5 gap-4">
              <div>
                <p className="font-syne font-bold text-[12px] tracking-widest text-blue mb-1.5">YOUR DOCUMENTS</p>
                <h2 className="font-syne font-extrabold text-[20px] text-navy">
                  {search ? `${filteredDocs.length} result${filteredDocs.length === 1 ? "" : "s"}` : `${documents.length} file${documents.length === 1 ? "" : "s"}`}
                </h2>
              </div>

              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className={`shrink-0 px-5 py-3 rounded-xl bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[14px] text-white border-none cursor-pointer flex items-center gap-2 shadow-[0_4px_14px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(37,99,235,0.38)] transition-all duration-200 ${uploading ? "opacity-70 pointer-events-none" : ""}`}>
                {uploading
                  ? <><div className="w-[16px] h-[16px] rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />Uploading…</>
                  : <>+ Upload PDF</>}
              </button>
              <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-[20px] transition-all duration-200 ${dragOver ? "ring-4 ring-blue/20" : ""}`}
            >
              {loadingDocs ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-[104px] rounded-2xl bg-slate-100 animate-pulse" />)}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-4">📄</div>
                  <h3 className="font-syne font-bold text-[17px] text-navy mb-1">No documents yet</h3>
                  <p className="font-inter text-[14px] text-slate-500 mb-5 max-w-[300px] leading-relaxed">
                    Upload your first PDF — or drag one in here — to unlock chat, quizzes, flashcards, and more.
                  </p>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-blue to-blue-dark font-syne font-semibold text-[14px] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all duration-200">
                    Upload a PDF
                  </button>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl mb-4">🔍</div>
                  <h3 className="font-syne font-bold text-[17px] text-navy mb-1">No matches</h3>
                  <p className="font-inter text-[14px] text-slate-500">No documents match "{search}".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDocs.map(doc => {
                    const selected = selectedDocId === doc._id;
                    return (
                      <div key={doc._id} onClick={() => setSelectedDocId(doc._id)}
                        className={`relative group cursor-pointer bg-white rounded-2xl p-5 border-[1.5px] transition-all duration-250
                             ${selected
                            ? "border-blue ring-4 ring-blue/10"
                            : "border-slate-100 hover:border-blue-100 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(10,22,40,0.08)]"}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-base leading-none shrink-0">📄</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-syne font-semibold text-[14px] text-navy truncate" title={doc.fileName}>{doc.fileName}</p>
                            <p className="font-inter text-[11px] text-slate-400 mt-0.5">{formatDate(doc.createdAt)}</p>
                          </div>
                          {selected && <span className="text-blue text-base shrink-0">✓</span>}
                        </div>

                        <button onClick={(e) => handleDelete(doc, e)}
                          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white border border-slate-100 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[13px] text-slate-400 hover:text-red-500 hover:border-red-200 transition-all duration-200">
                          🗑
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_12px_32px_rgba(10,22,40,0.18)] border font-inter text-[14px] max-w-[360px] animate-fade-up
          ${toast.type === "success" ? "bg-green-50 border-green-200 text-green-700" :
            toast.type === "error" ? "bg-red-50 border-red-200 text-red-700" :
              toast.type === "warn" ? "bg-amber-50 border-amber-200 text-amber-700" :
                "bg-blue-50 border-blue-200 text-blue-700"}`}>
          <span className="shrink-0">{toast.type === "success" ? "✅" : toast.type === "error" ? "⚠️" : toast.type === "warn" ? "👉" : "✨"}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}