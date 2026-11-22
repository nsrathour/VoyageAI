
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

import {
  Plane,
  Plus,
  Menu,
  X,
  ArrowUp,
  MapPin,
  Hotel,
  TrainFront,
  Utensils,
  Sparkles,
  Loader2,
  AlertCircle,
  CalendarDays,
  Check,
  Ban,
  UserRound,
  MessageSquare,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const suggestions = [
  {
    icon: Plane,
    title: "Find Flights",
    prompt:
      "Find affordable round-trip flights from DEL to GOI for 1 passenger, departing 2026-12-11 and returning 2026-12-16.",
  },
  {
    icon: Hotel,
    title: "Explore Hotels",
    prompt:
      "Find budget-friendly hotels in Goa for 2 guests from 2026-12-11 to 2026-12-16.",
  },
  {
    icon: TrainFront,
    title: "Search Trains",
    prompt:
      "Find trains from BSL to ADI on 2026-11-23 for 1 passenger. Compare durations and classes.",
  },
  {
    icon: Utensils,
    title: "Discover Dining",
    prompt:
      "Find top-rated restaurants near Calangute Beach, Goa, India, with a minimum rating of 4.0.",
  },
];

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-5 text-2xl font-bold text-slate-900">
      {children}
    </h1>
  ),

  h2: ({ children }) => (
    <h2 className="mb-3 mt-5 text-xl font-semibold text-slate-900">
      {children}
    </h2>
  ),

  h3: ({ children }) => (
    <h3 className="mb-2 mt-4 text-lg font-semibold text-slate-900">
      {children}
    </h3>
  ),

  p: ({ children }) => (
    <p className="my-2 leading-7">{children}</p>
  ),

  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1 pl-6">
      {children}
    </ul>
  ),

  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6">
      {children}
    </ol>
  ),

  li: ({ children }) => <li>{children}</li>,

  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">
      {children}
    </strong>
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-600 underline hover:text-sky-700"
    >
      {children}
    </a>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-sky-300 pl-4 text-slate-600">
      {children}
    </blockquote>
  ),

  code: ({ children }) => (
    <code className="wrap-break-word rounded bg-slate-100 px-1 py-0.5 text-xs">
      {children}
    </code>
  ),
};

function createMessage(role, content, extra = {}) {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    ...extra,
  };
}

function ApprovalCard({
  message,
  loading,
  onApproval,
}) {
  const data = message.approval_request || {};
  const isPending = message.status === "pending";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 font-semibold text-amber-700">
        <CalendarDays size={20} />
        Alternative Dates Suggested
      </div>

      <p className="text-sm leading-6 text-slate-600">
        {data.message || "Alternative travel dates are available for review."}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Original Dates
          </p>

          <p className="text-sm font-medium text-slate-700">
            {data.original_check_in} → {data.original_check_out}
          </p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
            Suggested Dates
          </p>

          <p className="text-sm font-semibold text-slate-900">
            {data.suggested_check_in} → {data.suggested_check_out}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        {data.question}
      </p>

      {isPending ? (
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            type="button"
            onClick={() => onApproval("approve")}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Check size={17} />
            )}

            Approve New Dates
          </button>

          <button
            type="button"
            onClick={() => onApproval("reject")}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Ban size={17} />
            Reject
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
          Decision:{" "}
          {message.decision === "approve"
            ? "Approved alternative dates"
            : "Rejected alternative dates"}
        </div>
      )}
    </div>
  );
}

function ChatMessage({
  message,
  loading,
  onApproval,
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-sky-500 px-5 py-3 text-sm leading-7 text-white shadow-sm sm:max-w-[75%]">
          <p className="whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        </div>

        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 sm:flex">
          <UserRound size={19} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
        <Sparkles size={19} />
      </div>

      <div className="min-w-0 max-w-[calc(100%-3rem)] flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            VoyageAI
          </span>

          {message.role === "approval" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              Approval required
            </span>
          )}
        </div>

        <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {message.role === "approval" ? (
            <ApprovalCard
              message={message}
              loading={loading}
              onApproval={onApproval}
            />
          ) : (
            <div className="wrap-break-word text-sm leading-7 text-slate-700">
              <ReactMarkdown components={markdownComponents}>
                {message.content || ""}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Current LangGraph conversation
  const [threadId, setThreadId] = useState(null);

  // Visible chat history
  const [messages, setMessages] = useState([]);

  // Last API result, used for HITL state
  const [response, setResponse] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);
  const requestInProgress = useRef(false);

  const approvalPending = response?.status === "interrupted";

  // Automatically scroll to the latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading, error]);

  // Start a completely new trip
  const handleNewTrip = () => {
    if (requestInProgress.current) return;

    setQuery("");
    setThreadId(null);
    setMessages([]);
    setResponse(null);
    setError("");
    setSidebarOpen(false);
  };

  // Submit a new user message
  const handleSubmit = async (event) => {
    event.preventDefault();

    const userQuery = query.trim();

    if (
      !userQuery ||
      requestInProgress.current ||
      approvalPending
    ) {
      return;
    }

    requestInProgress.current = true;
    setLoading(true);
    setError("");

    try {
      const result = await axios.post(
        `${API_URL}/api/chat`,
        {
          query: userQuery,
          thread_id: threadId,
        },
        {
          timeout: 120000,
        }
      );

      const data = result.data;

      if (
        data.status !== "completed" &&
        data.status !== "interrupted"
      ) {
        throw new Error("Unexpected response from VoyageAI.");
      }

      // Save LangGraph thread for future follow-ups
      setThreadId(data.thread_id);
      setResponse(data);

      const userMessage = createMessage("user", userQuery);

      const assistantMessage =
        data.status === "interrupted"
          ? createMessage("approval", "", {
              approval_request: data.approval_request,
              status: "pending",
            })
          : createMessage("assistant", data.response || "");

      // Append messages instead of replacing old history
      setMessages((previous) => [
        ...previous,
        userMessage,
        assistantMessage,
      ]);

      setQuery("");
    } catch (err) {
      console.error("VoyageAI API error:", err);

      if (err.code === "ECONNABORTED") {
        setError(
          "The request timed out. It may still have been processed. Please check the backend before retrying."
        );
      } else if (err.response) {
        setError(
          typeof err.response.data?.detail === "string"
            ? err.response.data.detail
            : "The server could not process your request."
        );
      } else {
        setError(
          err.message === "Unexpected response from VoyageAI."
            ? err.message
            : "Unable to connect to VoyageAI. Please check if the backend is running."
        );
      }
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  };

  // Approve or reject an interrupted workflow
  const handleApproval = async (decision) => {
    if (
      requestInProgress.current ||
      !approvalPending ||
      !response?.thread_id
    ) {
      return;
    }

    requestInProgress.current = true;
    setLoading(true);
    setError("");

    try {
      const result = await axios.post(
        `${API_URL}/api/approval`,
        {
          thread_id: response.thread_id,
          decision,
        },
        {
          timeout: 120000,
        }
      );

      const data = result.data;

      if (
        data.status !== "completed" &&
        data.status !== "interrupted"
      ) {
        throw new Error("Unexpected approval response.");
      }

      setThreadId(data.thread_id);
      setResponse(data);

      setMessages((previous) => {
        // Mark the previous approval card as resolved
        const updated = previous.map((message) => {
          if (
            message.role === "approval" &&
            message.status === "pending"
          ) {
            return {
              ...message,
              status: "resolved",
              decision,
            };
          }

          return message;
        });

        const nextMessage =
          data.status === "interrupted"
            ? createMessage("approval", "", {
                approval_request: data.approval_request,
                status: "pending",
              })
            : createMessage("assistant", data.response || "");

        return [...updated, nextMessage];
      });
    } catch (err) {
      console.error("VoyageAI approval error:", err);

      if (err.code === "ECONNABORTED") {
        setError(
          "Approval request timed out. The decision may have been processed, so check the backend before retrying."
        );
      } else if (err.response) {
        setError(
          typeof err.response.data?.detail === "string"
            ? err.response.data.detail
            : "Unable to process your decision."
        );
      } else {
        setError(
          err.message === "Unexpected approval response."
            ? err.message
            : "Could not reach VoyageAI. Please check the backend connection."
        );
      }
    } finally {
      requestInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-sky-500 p-2 text-white">
              <Plane size={22} />
            </div>

            <span className="text-xl font-bold tracking-tight">
              Voyage
              <span className="text-sky-500">AI</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Trip */}
        <div className="px-4">
          <button
            type="button"
            onClick={handleNewTrip}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Plus size={18} />
            New Trip
          </button>
        </div>

        {/* Sidebar conversation status */}
        <div className="mt-8 px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Trips
          </p>

          {threadId ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-sky-700">
                <MessageSquare size={17} />
                Current Trip
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {messages.filter((m) => m.role === "user").length} user messages
              </p>

              <p className="mt-1 truncate font-mono text-xs text-slate-400">
                {threadId.slice(0, 12)}...
              </p>
            </div>
          ) : (
            <p className="rounded-xl px-3 py-3 text-sm text-slate-400">
              Your trips will appear here.
            </p>
          )}

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Saved trip history will be added in a later step.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-slate-100 p-5">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Sparkles size={18} className="text-sky-500" />
            Powered by Agentic AI
          </div>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="font-semibold">
                AI Travel Planner
              </h2>

              <p className="text-xs text-slate-500">
                Discover. Plan. Explore.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {threadId && (
              <span className="hidden items-center gap-2 text-xs text-emerald-600 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active conversation
              </span>
            )}

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
              V
            </div>
          </div>
        </header>

        {/* Scrollable chat area */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            {messages.length === 0 && !loading ? (
              /* Welcome Screen */
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-16">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                  <Sparkles size={16} />
                  Your AI Travel Companion
                </div>

                <h1 className="text-center text-4xl font-bold tracking-tight sm:text-5xl">
                  Where to{" "}
                  <span className="text-sky-500">
                    next?
                  </span>
                </h1>

                <p className="mx-auto mt-4 max-w-xl text-center text-slate-500">
                  Tell me where you want to go. I'll help
                  you explore flights, trains, hotels,
                  and restaurants.
                </p>

                {/* Suggestion Cards */}
                <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => setQuery(item.prompt)}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-sm"
                      >
                        <div className="rounded-lg bg-sky-50 p-3 text-sky-600">
                          <Icon size={21} />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900">
                            {item.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Explore travel options
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Conversation history */
              <div className="space-y-7 pb-6">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    loading={loading}
                    onApproval={handleApproval}
                  />
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                  <Sparkles size={19} />
                </div>

                <div className="rounded-2xl border border-sky-100 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Loader2
                      size={18}
                      className="animate-spin text-sky-500"
                    />

                    {approvalPending
                      ? "Resuming your travel workflow..."
                      : "VoyageAI is thinking..."}
                  </div>
                </div>
              </div>
            )}

            {/* API Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
              >
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div>
                  <p className="font-semibold">
                    Something went wrong
                  </p>
                  <p className="mt-1 text-sm">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </main>

        {/* Persistent Chat Input */}
        <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-8">
          <div className="mx-auto w-full max-w-3xl">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-md shadow-slate-200/50"
            >
              <textarea
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();

                    if (
                      query.trim() &&
                      !loading &&
                      !approvalPending
                    ) {
                      event.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
                placeholder={
                  approvalPending
                    ? "Approve or reject the pending date change first..."
                    : threadId
                    ? "Ask a follow-up question..."
                    : "Plan a 5-day trip to Goa from Delhi..."
                }
                rows={2}
                disabled={loading || approvalPending}
                className="max-h-40 w-full resize-none border-none bg-transparent p-2 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
              />

              <div className="flex items-center justify-between px-2">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={14} />

                  {approvalPending
                    ? "Waiting for your approval"
                    : "Enter to send • Shift+Enter for new line"}
                </span>

                <button
                  type="submit"
                  disabled={
                    !query.trim() ||
                    loading ||
                    approvalPending
                  }
                  aria-label="Send travel request"
                  className="flex items-center justify-center rounded-xl bg-sky-500 p-3 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowUp size={18} />
                  )}
                </button>
              </div>
            </form>

            <p className="mt-2 text-center text-xs text-slate-400">
              VoyageAI provides travel recommendations.
              Prices and availability may change.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
