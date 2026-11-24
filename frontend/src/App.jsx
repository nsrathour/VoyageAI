import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  Plane, Plus, Menu, X, ArrowUp, MapPin, Hotel, TrainFront, Utensils,
  Sparkles, Loader2, AlertCircle, CalendarDays, Check, Ban, UserRound,
  MessageSquare, MoreHorizontal, Pencil, Save, Trash2,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";
const ACTIVE_THREAD_KEY = "voyageai_active_thread";

const suggestions = [
  { icon: Plane, title: "Find Flights", prompt: "Find affordable round-trip flights from DEL to GOI for 1 passenger, departing 2026-12-11 and returning 2026-12-16." },
  { icon: Hotel, title: "Explore Hotels", prompt: "Find budget-friendly hotels in Goa for 2 guests from 2026-12-11 to 2026-12-16." },
  { icon: TrainFront, title: "Search Trains", prompt: "Find trains from BSL to ADI on 2026-12-12 for 1 passenger. Compare durations and classes." },
  { icon: Utensils, title: "Discover Dining", prompt: "Find top-rated restaurants near Calangute Beach, Goa, India, with a minimum rating of 4.0." },
];

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-4 mt-5 text-2xl font-bold text-slate-900">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-semibold text-slate-900">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900">{children}</h3>,
  p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline hover:text-sky-700">{children}</a>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-4 border-sky-300 pl-4 text-slate-600">{children}</blockquote>,
  code: ({ children }) => <code className="wrap-break-word rounded bg-slate-100 px-1 py-0.5 text-xs">{children}</code>,
};

const createMessage = (role, content, extra = {}) => ({
  id: crypto.randomUUID(), role, content, ...extra,
});

function saveActiveThread(id) {
  if (id) localStorage.setItem(ACTIVE_THREAD_KEY, id);
  else localStorage.removeItem(ACTIVE_THREAD_KEY);
}

function getRequestError(err, fallback) {
  if (err?.code === "ECONNABORTED") return "Request timed out. It might still have been processed; check the backend before retrying.";
  const detail = err?.response?.data?.detail;
  return typeof detail === "string" ? detail : err?.message || fallback;
}

function ApprovalCard({ message, loading, onApproval }) {
  const data = message.approval_request || {};
  const pending = message.status === "pending";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-semibold text-amber-700">
        <CalendarDays size={20} /> Alternative Dates Suggested
      </div>
      <p className="text-sm leading-6 text-slate-600">
        {data.message || "Alternative travel dates are available for review."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Original Dates</p>
          <p className="text-sm font-medium text-slate-700">{data.original_check_in} → {data.original_check_out}</p>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-600">Suggested Dates</p>
          <p className="text-sm font-semibold text-slate-900">{data.suggested_check_in} → {data.suggested_check_out}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600">{data.question}</p>
      {pending ? (
        <div className="flex flex-wrap gap-3 pt-1">
          <button type="button" onClick={() => onApproval("approve")} disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />} Approve New Dates
          </button>
          <button type="button" onClick={() => onApproval("reject")} disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            <Ban size={17} /> Reject
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
          Decision: {message.decision === "approve" ? "Approved alternative dates" : "Rejected alternative dates"}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ message, loading, onApproval }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-sky-500 px-5 py-3 text-sm leading-7 text-white shadow-sm sm:max-w-[75%]">
          <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
        </div>
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 sm:flex"><UserRound size={19} /></div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><Sparkles size={19} /></div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">VoyageAI</span>
          {message.role === "approval" && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Approval required</span>}
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {message.role === "approval" ? (
            <ApprovalCard message={message} loading={loading} onApproval={onApproval} />
          ) : (
            <div className="wrap-break-word text-sm leading-7 text-slate-700">
              <ReactMarkdown components={markdownComponents}>{message.content || ""}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [response, setResponse] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");

  // Day 13: editable conversation title state.
  const [menuThreadId, setMenuThreadId] = useState(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const chatEndRef = useRef(null);
  const requestInProgress = useRef(false);
  const initialRestoreInProgress = useRef(true);

  const approvalPending = response?.status === "interrupted";
  const busy = loading || historyLoading || renameLoading || deleteLoading;
  const completedTrips = conversations.filter((trip) => trip.status === "completed");

  const refreshConversations = async () => {
    try {
      const result = await axios.get(`${API_URL}/api/conversations`, { timeout: 20000 });
      setConversations(Array.isArray(result.data.conversations) ? result.data.conversations : []);
    } catch (err) {
      console.error("Failed to refresh Recent Trips:", err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const savedId = localStorage.getItem(ACTIVE_THREAD_KEY);
        const listResult = await axios.get(`${API_URL}/api/conversations`, { timeout: 20000 });
        if (cancelled) return;
        const trips = Array.isArray(listResult.data.conversations) ? listResult.data.conversations : [];
        setConversations(trips);
        const savedTrip = trips.find((trip) => trip.thread_id === savedId);
        if (savedId && savedTrip?.status === "completed") {
          const historyResult = await axios.get(`${API_URL}/api/conversations/${encodeURIComponent(savedId)}`, { timeout: 20000 });
          if (cancelled) return;
          if (historyResult.data.status === "completed") {
            setThreadId(savedId);
            setMessages((historyResult.data.messages || []).map((item) => createMessage(item.role, item.content)));
            setResponse({ status: "completed", thread_id: savedId });
          } else saveActiveThread(null);
        } else if (savedId) saveActiveThread(null);
      } catch (err) {
        console.error("VoyageAI startup restore failed:", err);
        if (!cancelled) setError("Unable to load saved trips. Check the backend connection.");
      } finally {
        if (!cancelled) {
          initialRestoreInProgress.current = false;
          setHistoryLoading(false);
        }
      }
    };
    initialize();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!initialRestoreInProgress.current) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading, error, historyLoading]);

  const handleNewTrip = () => {
    if (busy || requestInProgress.current) return;
    setQuery("");
    setThreadId(null);
    setMessages([]);
    setResponse(null);
    setError("");
    setSidebarOpen(false);
    setMenuThreadId(null);
    setEditingThreadId(null);
    setRenameError("");
    saveActiveThread(null);
  };

  const loadConversation = async (id) => {
    if (busy || requestInProgress.current) return;
    if (id === threadId) { setSidebarOpen(false); return; }
    const trip = conversations.find((item) => item.thread_id === id);
    if (trip?.status !== "completed") return;
    requestInProgress.current = true;
    setHistoryLoading(true);
    setError("");
    setMenuThreadId(null);
    try {
      const result = await axios.get(`${API_URL}/api/conversations/${encodeURIComponent(id)}`, { timeout: 20000 });
      if (result.data.status !== "completed") throw new Error("This conversation is not completed yet.");
      setMessages((result.data.messages || []).map((item) => createMessage(item.role, item.content)));
      setThreadId(id);
      setResponse({ status: "completed", thread_id: id });
      setQuery("");
      setSidebarOpen(false);
      saveActiveThread(id);
    } catch (err) {
      console.error("Conversation restore failed:", err);
      setError(getRequestError(err, "Unable to restore conversation."));
    } finally {
      requestInProgress.current = false;
      setHistoryLoading(false);
    }
  };

  // Rename only the title metadata; never touch LangGraph checkpoint messages.
  const startRename = (trip) => {
    if (busy || requestInProgress.current) return;
    setEditingThreadId(trip.thread_id);
    setEditedTitle(trip.title || "");
    setRenameError("");
    setMenuThreadId(null);
  };

  const cancelRename = () => {
    if (renameLoading) return;
    setEditingThreadId(null);
    setEditedTitle("");
    setRenameError("");
  };

  const handleRename = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    const title = editedTitle.trim();
    if (!title) { setRenameError("Trip title cannot be empty."); return; }
    if (title.length > 100) { setRenameError("Trip title must be at most 100 characters."); return; }
    if (busy || requestInProgress.current) return;
    setRenameLoading(true);
    setRenameError("");
    try {
      const result = await axios.patch(
        `${API_URL}/api/conversations/${encodeURIComponent(id)}`,
        { title },
        { timeout: 20000 }
      );
      const savedTitle = result.data.title || title;
      // Immediate UI update; refresh from SQLite to verify persistent metadata.
      setConversations((prev) => prev.map((trip) => trip.thread_id === id ? { ...trip, title: savedTitle } : trip));
      setEditingThreadId(null);
      setEditedTitle("");
      await refreshConversations();
    } catch (err) {
      console.error("Rename conversation failed:", err);
      setRenameError(getRequestError(err, "Could not rename this trip."));
    } finally {
      setRenameLoading(false);
    }
  };

  // Delete only after an explicit confirmation. The backend permanently
  // removes both LangGraph checkpoints and custom title metadata.
  const requestDelete = (trip) => {
    if (busy || requestInProgress.current) return;
    setDeleteTarget(trip);
    setDeleteError("");
    setMenuThreadId(null);
  };

  const cancelDelete = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget || busy || requestInProgress.current) return;
    const id = deleteTarget.thread_id;
    requestInProgress.current = true;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await axios.delete(
        `${API_URL}/api/conversations/${encodeURIComponent(id)}`,
        { timeout: 20000 }
      );
      // Update immediately; do not depend on a follow-up list request.
      setConversations((prev) => prev.filter((trip) => trip.thread_id !== id));
      if (threadId === id) {
        setThreadId(null);
        setMessages([]);
        setResponse(null);
        setQuery("");
        setError("");
        saveActiveThread(null);
      } else if (localStorage.getItem(ACTIVE_THREAD_KEY) === id) {
        saveActiveThread(null);
      }
      if (editingThreadId === id) {
        setEditingThreadId(null);
        setEditedTitle("");
        setRenameError("");
      }
      setDeleteTarget(null);
      setMenuThreadId(null);
      await refreshConversations();
    } catch (err) {
      console.error("Delete conversation failed:", err);
      setDeleteError(getRequestError(err, "Could not delete this trip."));
    } finally {
      requestInProgress.current = false;
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const userQuery = query.trim();
    if (!userQuery || busy || approvalPending || requestInProgress.current) return;
    requestInProgress.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await axios.post(`${API_URL}/api/chat`, { query: userQuery, thread_id: threadId }, { timeout: 120000 });
      const data = result.data;
      if (!data.thread_id || !["completed", "interrupted"].includes(data.status)) throw new Error("Unexpected response from VoyageAI.");
      setThreadId(data.thread_id);
      setResponse(data);
      setMessages((previous) => [
        ...previous,
        createMessage("user", userQuery),
        data.status === "interrupted"
          ? createMessage("approval", "", { approval_request: data.approval_request, status: "pending" })
          : createMessage("assistant", data.response || ""),
      ]);
      setQuery("");
      saveActiveThread(data.status === "completed" ? data.thread_id : null);
      await refreshConversations();
    } catch (err) {
      console.error("VoyageAI chat error:", err);
      setError(getRequestError(err, "Unable to process the request."));
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  };

  const handleApproval = async (decision) => {
    if (busy || requestInProgress.current || !approvalPending || !response?.thread_id) return;
    requestInProgress.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await axios.post(`${API_URL}/api/approval`, { thread_id: response.thread_id, decision }, { timeout: 120000 });
      const data = result.data;
      if (!data.thread_id || !["completed", "interrupted"].includes(data.status)) throw new Error("Unexpected approval response.");
      setThreadId(data.thread_id);
      setResponse(data);
      setMessages((previous) => {
        const updated = previous.map((message) =>
          message.role === "approval" && message.status === "pending"
            ? { ...message, status: "resolved", decision }
            : message
        );
        const nextMessage = data.status === "interrupted"
          ? createMessage("approval", "", { approval_request: data.approval_request, status: "pending" })
          : createMessage("assistant", data.response || "");
        return [...updated, nextMessage];
      });
      saveActiveThread(data.status === "completed" ? data.thread_id : null);
      await refreshConversations();
    } catch (err) {
      console.error("VoyageAI approval error:", err);
      setError(getRequestError(err, "Unable to process your approval."));
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {sidebarOpen && <button type="button" aria-label="Close sidebar overlay" className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/50 px-4"
          role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelDelete(); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="delete-trip-title"
            aria-describedby="delete-trip-description"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>
            <h2 id="delete-trip-title" className="text-lg font-semibold text-slate-900">Delete this trip?</h2>
            <p id="delete-trip-description" className="mt-2 text-sm leading-6 text-slate-600">
              <strong className="wrap-break-word text-slate-900">{deleteTarget.title || "Untitled Trip"}</strong> and its saved conversation will be permanently deleted. This cannot be undone.
            </p>
            {deleteError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={cancelDelete} disabled={deleteLoading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleteLoading}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}


      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 shrink-0 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-sky-500 p-2 text-white"><Plane size={22} /></div>
            <span className="text-xl font-bold tracking-tight">Voyage<span className="text-sky-500">AI</span></span>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden" aria-label="Close sidebar"><X size={20} /></button>
        </div>

        <div className="shrink-0 px-4">
          <button type="button" onClick={handleNewTrip} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-600 disabled:opacity-50"><Plus size={18} /> New Trip</button>
        </div>

        <div className="mt-8 min-h-0 flex-1 overflow-y-auto px-4">
          <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Trips</p>
          {historyLoading && <p className="px-3 py-2 text-xs text-slate-400">Loading conversations...</p>}
          <div className="space-y-1">
            {completedTrips.map((trip) => (
              <div key={trip.thread_id} className={`group relative rounded-xl ${threadId === trip.thread_id ? "bg-sky-50" : "hover:bg-slate-100"}`}>
                {editingThreadId === trip.thread_id ? (
                  <form onSubmit={(event) => handleRename(event, trip.thread_id)} className="space-y-2 p-2">
                    <input
                      autoFocus
                      type="text"
                      maxLength={100}
                      aria-label="New trip title"
                      value={editedTitle}
                      onChange={(event) => { setEditedTitle(event.target.value); setRenameError(""); }}
                      onKeyDown={(event) => { if (event.key === "Escape") cancelRename(); }}
                      disabled={renameLoading}
                      className="w-full rounded-lg border border-sky-300 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                    />
                    <div className="flex gap-2">
                      <button type="submit" disabled={renameLoading || !editedTitle.trim()}
                        className="flex items-center gap-1 rounded-lg bg-sky-500 px-2 py-1.5 text-xs text-white disabled:opacity-50">
                        {renameLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                      </button>
                      <button type="button" onClick={cancelRename} disabled={renameLoading}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600">Cancel</button>
                    </div>
                    {renameError && <p role="alert" className="text-xs text-red-600">{renameError}</p>}
                  </form>
                ) : (
                  <div className="flex items-center gap-1 pr-1">
                    <button type="button" onClick={() => loadConversation(trip.thread_id)} disabled={busy}
                      title={trip.title} className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-3 text-left text-sm disabled:opacity-60 ${threadId === trip.thread_id ? "font-medium text-sky-700" : "text-slate-600"}`}>
                      <MessageSquare size={16} className="shrink-0" />
                      <span className="truncate">{trip.title || "Untitled Trip"}</span>
                    </button>
                    <button type="button" disabled={busy}
                      aria-label={`Options for ${trip.title || "Untitled Trip"}`}
                      aria-expanded={menuThreadId === trip.thread_id}
                      onClick={() => setMenuThreadId((current) => current === trip.thread_id ? null : trip.thread_id)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-50">
                      <MoreHorizontal size={17} />
                    </button>
                  </div>
                )}
                {menuThreadId === trip.thread_id && editingThreadId !== trip.thread_id && (
                  <div className="mx-2 mb-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    <button type="button" onClick={() => startRename(trip)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                      <Pencil size={15} /> Rename Trip
                    </button>
                    <button type="button" onClick={() => requestDelete(trip)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                      <Trash2 size={15} /> Delete Trip
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!historyLoading && completedTrips.length === 0 && <p className="px-3 py-3 text-sm text-slate-400">Your completed trips will appear here.</p>}
          <p className="mt-4 px-3 text-xs leading-5 text-slate-400">Pending approval conversations are not yet restorable.</p>
        </div>
        <div className="shrink-0 border-t border-slate-100 p-5"><div className="flex items-center gap-3 text-sm text-slate-500"><Sparkles size={18} className="text-sky-500" />Powered by Agentic AI</div></div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" aria-label="Open sidebar"><Menu size={22} /></button>
            <div><h2 className="font-semibold">AI Travel Planner</h2><p className="text-xs text-slate-500">Discover. Plan. Explore.</p></div>
          </div>
          <div className="flex items-center gap-3">
            {threadId && <span className="hidden items-center gap-2 text-xs text-emerald-600 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active conversation</span>}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">V</div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            {historyLoading && messages.length === 0 ? (
              <div className="flex items-center justify-center gap-3 py-24 text-sm text-slate-500"><Loader2 size={20} className="animate-spin" /> Loading saved conversations...</div>
            ) : messages.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-16">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700"><Sparkles size={16} /> Your AI Travel Companion</div>
                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">Where to <span className="text-sky-500">next?</span></h1>
                <p className="mx-auto mt-4 max-w-xl text-center text-slate-500">Tell me where you want to go. I'll help you explore flights, trains, hotels, and restaurants.</p>
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => {
                    const Icon = item.icon;
                    return <button key={item.title} type="button" onClick={() => setQuery(item.prompt)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-sm"><div className="rounded-lg bg-sky-50 p-3 text-sky-600"><Icon size={21} /></div><div><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-400">Explore travel options</p></div></button>;
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-7 pb-6">{messages.map((message) => <ChatMessage key={message.id} message={message} loading={loading} onApproval={handleApproval} />)}</div>
            )}
            {loading && <div role="status" className="mt-6 flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><Sparkles size={19} /></div><div className="rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-sm"><div className="flex items-center gap-3 text-sm text-slate-600"><Loader2 size={18} className="animate-spin text-sky-500" />{approvalPending ? "Resuming your travel workflow..." : "VoyageAI is thinking..."}</div></div></div>}
            {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle size={20} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Something went wrong</p><p className="mt-1 text-sm">{error}</p></div></div>}
            <div ref={chatEndRef} />
          </div>
        </main>

        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/50">
              <textarea value={query} onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (query.trim() && !busy && !approvalPending) event.currentTarget.form?.requestSubmit(); } }}
                placeholder={approvalPending ? "Approve or reject the pending date change first..." : threadId ? "Ask a follow-up question..." : "Plan a 5-day trip to Goa from Delhi..."}
                rows={2} disabled={busy || approvalPending}
                className="max-h-40 w-full resize-none border-none bg-transparent p-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60" />
              <div className="flex items-center justify-between px-2"><span className="flex items-center gap-1 text-xs text-slate-400"><MapPin size={14} />{approvalPending ? "Waiting for your approval" : "Enter to send • Shift+Enter for new line"}</span><button type="submit" disabled={!query.trim() || busy || approvalPending} aria-label="Send travel request" className="flex items-center justify-center rounded-xl bg-sky-500 p-3 text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40">{loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}</button></div>
            </form>
            <p className="mt-2 text-center text-xs text-slate-400">VoyageAI provides travel recommendations. Prices and availability may change.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
