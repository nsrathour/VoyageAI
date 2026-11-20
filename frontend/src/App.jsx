
import { useState } from "react";
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
  CheckCircle2,
  CalendarDays,
  Check,
  Ban,
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
      "Find trains from BSL to ADI on 2026-11-21 for 1 passenger. Compare durations and classes.",
  },
  {
    icon: Utensils,
    title: "Discover Dining",
    prompt:
      "Find top-rated restaurants near Calangute Beach, Goa, India, with a minimum rating of 4.0.",
  },
];

function App() {
  // UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");

  // API states
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset current trip
  const handleNewTrip = () => {
    if (loading) return;

    setQuery("");
    setResponse(null);
    setError("");
    setSidebarOpen(false);
  };

  // Submit a new travel request
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!query.trim() || loading) return;

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const result = await axios.post(
        `${API_URL}/api/chat`,
        {
          query: query.trim(),
        },
        {
          timeout: 120000,
        }
      );

      setResponse(result.data);
    } catch (err) {
      console.error("VoyageAI API error:", err);

      if (err.code === "ECONNABORTED") {
        setError("The request timed out. Please try again.");
      } else if (err.response) {
        setError(
          typeof err.response.data?.detail === "string"
            ? err.response.data.detail
            : "The server could not process your request."
        );
      } else {
        setError(
          "Unable to connect to VoyageAI. Please check if the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Resume interrupted LangGraph workflow
  const handleApproval = async (decision) => {
    if (
      loading ||
      response?.status !== "interrupted" ||
      !response?.thread_id
    ) {
      return;
    }

    const threadId = response.thread_id;

    setLoading(true);
    setError("");

    try {
      const result = await axios.post(
        `${API_URL}/api/approval`,
        {
          thread_id: threadId,
          decision,
        },
        {
          timeout: 120000,
        }
      );

      setResponse(result.data);
    } catch (err) {
      console.error("VoyageAI approval error:", err);

      if (err.code === "ECONNABORTED") {
        setError(
          "The approval request timed out. The decision may have been processed. Check the backend before retrying."
        );
      } else if (err.response) {
        setError(
          typeof err.response.data?.detail === "string"
            ? err.response.data.detail
            : "Unable to process your decision."
        );
      } else {
        setError(
          "Could not reach VoyageAI. Please check the backend connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
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
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Trip Button */}
        <div className="px-4">
          <button
            onClick={handleNewTrip}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            New Trip
          </button>
        </div>

        {/* Recent Trips */}
        <div className="mt-8 px-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Trips
          </p>

          <div className="rounded-xl px-3 py-3 text-sm text-slate-400">
            Your trips will appear here.
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t border-slate-100 p-5">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Sparkles
              size={18}
              className="text-sky-500"
            />
            Powered by Agentic AI
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <button
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

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">
            V
          </div>
        </header>

        {/* Workspace */}
        <main className="flex flex-1 flex-col items-center justify-center px-5 py-12">
          <div className="w-full max-w-3xl">
            {/* Welcome Section */}
            <div className="mb-10 text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                <Sparkles size={16} />
                Your AI Travel Companion
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Where to{" "}
                <span className="text-sky-500">
                  next?
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-slate-500">
                Tell me where you want to go. I'll help you
                explore flights, trains, hotels, and restaurants.
              </p>
            </div>

            {/* Travel Query Input */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60"
            >
              <textarea
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Plan a 5-day trip to Goa from Delhi..."
                rows={3}
                disabled={loading || response?.status === "interrupted"}
                className="w-full resize-none border-none bg-transparent p-3 text-sm outline-none placeholder:text-slate-400 disabled:opacity-60"
              />

              <div className="flex items-center justify-between px-2 pb-1">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin size={14} />
                  Your journey starts here
                </span>

                <button
                  type="submit"
                  disabled={
                    !query.trim() ||
                    loading ||
                    response?.status === "interrupted"
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

            {/* Loading State */}
            {loading && (
              <div
                role="status"
                className="mt-6 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-700"
              >
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                <div>
                  <p className="font-medium">
                    VoyageAI is processing your request...
                  </p>

                  <p className="mt-1 text-xs text-sky-600">
                    {response?.status === "interrupted"
                      ? "Resuming your travel planning workflow."
                      : "Searching travel options and preparing recommendations."}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
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

            {/* AI Response */}
            {response && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                {/* Response Header */}
                <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="rounded-xl bg-sky-100 p-2 text-sky-600">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      VoyageAI Response
                    </h3>

                    <p className="text-xs text-slate-500">
                      Your AI-powered travel assistant
                    </p>
                  </div>
                </div>

                {/* Completed Response */}
                {response.status === "completed" && (
                  <div>
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
                      <CheckCircle2 size={17} />
                      Workflow completed
                    </div>

                    
<div className="wrap-break-word space-y-3 text-sm leading-7 text-slate-700">
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="mb-4 mt-6 text-2xl font-bold text-slate-900">
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
    }}
  >
    {response.response || ""}
  </ReactMarkdown>
</div>

                  </div>
                )}

                {/* Human Approval Required */}
                {response.status === "interrupted" && (
                  <div className="space-y-4">
                    {/* Heading */}
                    <div className="flex items-center gap-2 font-medium text-amber-700">
                      <CalendarDays size={20} />
                      Alternative Dates Suggested
                    </div>

                    {/* Message */}
                    <p className="text-sm text-slate-600">
                      {response.approval_request?.message}
                    </p>

                    {/* Date Comparison */}
                    <div className="rounded-xl bg-slate-50 p-4">
                      {/* Original Dates */}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Original dates
                      </p>

                      <p className="text-sm text-slate-700">
                        {response.approval_request?.original_check_in}
                        {" → "}
                        {response.approval_request?.original_check_out}
                      </p>

                      <div className="my-4 border-t border-slate-200" />

                      {/* Suggested Dates */}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-600">
                        Suggested dates
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {response.approval_request?.suggested_check_in}
                        {" → "}
                        {response.approval_request?.suggested_check_out}
                      </p>
                    </div>

                    {/* Approval Question */}
                    <p className="text-sm text-slate-600">
                      {response.approval_request?.question}
                    </p>

                    {/* Approval Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleApproval("approve")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loading ? (
                          <Loader2
                            size={17}
                            className="animate-spin"
                          />
                        ) : (
                          <Check size={17} />
                        )}

                        Approve New Dates
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproval("reject")}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Ban size={17} />
                        Reject
                      </button>
                    </div>

                    {/* Workflow Note */}
                    <p className="text-xs text-slate-400">
                      Your decision will resume the paused
                      AI workflow.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Suggestions */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {suggestions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    onClick={() => setQuery(item.prompt)}
                    disabled={
                      loading ||
                      response?.status === "interrupted"
                    }
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="rounded-lg bg-sky-50 p-3 text-sky-600">
                      <Icon size={21} />
                    </div>

                    <span className="font-medium">
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-400">
              VoyageAI provides travel recommendations.
              Prices and availability may change.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
