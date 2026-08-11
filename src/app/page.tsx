"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import VoiceButton from "@/components/VoiceButton";
import SpeakButton from "@/components/SpeakButton";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Session {
  id: number;
  job_role: string;
  created_at: string;
}

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newJobRole, setNewJobRole] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const fetchSessions = async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/sessions", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // Token expired ya invalid - wapas login bhej do
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    const data = await response.json();
    setSessions(data);
    setLoadingSessions(false);
  };

  const openNewSessionModal = () => {
    setNewJobRole("");
    setShowNewSessionModal(true);
  };

  const confirmNewSession = async () => {
    if (!newJobRole.trim()) return;

    const token = localStorage.getItem("token");
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ jobRole: newJobRole }),
    });

    const newSession = await response.json();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setShowNewSessionModal(false);
  };

  const deleteSession = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this interview session?")) return;

    const token = localStorage.getItem("token");
    await fetch(`/api/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
  };

  const openSession = async (sessionId: number) => {
    setActiveSessionId(sessionId);
    setMessages([]);

    const token = localStorage.getItem("token");
    const response = await fetch(`/api/sessions/${sessionId}/answers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    const answers = await response.json();

    const loadedMessages: Message[] = [];
    for (const item of answers) {
      loadedMessages.push({ role: "assistant", text: item.question });
      loadedMessages.push({ role: "user", text: item.answer });
    }
    setMessages(loadedMessages);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeSessionId) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: String(activeSessionId),
          message: userMessage.text,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900/80 backdrop-blur-lg border-r border-blue-900/40 flex flex-col">
        <div className="p-4 border-b border-blue-900/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg">
              🎯
            </div>
            <h1 className="text-white font-bold">InterviewMate</h1>
          </div>
          <button
            onClick={openNewSessionModal}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
          >
            + New Interview
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loadingSessions ? (
            <p className="text-blue-300 text-sm p-3">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-blue-300/60 text-sm p-3">
              No sessions yet. Start your first interview!
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => openSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer mb-1 transition-colors ${
                  activeSessionId === session.id
                    ? "bg-blue-600/30 border border-blue-500/40"
                    : "hover:bg-slate-800/60"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {session.job_role}
                  </p>
                  <p className="text-blue-300/60 text-xs">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm px-2 transition-opacity"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-blue-900/40 space-y-1">
          <button
            onClick={() => router.push("/profile")}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-blue-200 text-sm hover:bg-slate-800/60 hover:text-white transition-colors"
          >
            <span className="text-base">📄</span>
            <span>Upload Resume</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-300/80 text-sm hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <span className="text-base">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {!activeSessionId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-white text-xl font-semibold mb-2">
                Select or start an interview
              </h2>
              <p className="text-blue-300">
                Choose a session from the sidebar, or start a new one
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm flex-shrink-0">
                        🎯
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl prose prose-sm prose-invert ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-slate-800/80 border border-blue-900/40 text-blue-50 rounded-bl-md"
                        }`}
                      >
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.role === "assistant" && (
                        <div className="flex justify-start px-1">
                          <SpeakButton text={msg.text} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm flex-shrink-0">
                      🎯
                    </div>
                    <div className="bg-slate-800/80 border border-blue-900/40 px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0.15s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-[bounce_1s_infinite_0.3s]"></span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-lg border-t border-blue-900/40 p-4">
              <div className="max-w-3xl mx-auto flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer..."
                  rows={1}
                  className="flex-1 px-4 py-3 bg-slate-800/60 border border-blue-800/40 text-white placeholder-blue-300/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <VoiceButton
                  onTranscript={(text) =>
                    setInput((prev) => prev + (prev ? " " : "") + text)
                  }
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white w-12 h-12 rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-blue-900/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <h2 className="text-white text-lg font-semibold mb-1">
              Start New Interview
            </h2>
            <p className="text-blue-300 text-sm mb-4">
              What role are you preparing for?
            </p>
            <input
              type="text"
              autoFocus
              value={newJobRole}
              onChange={(e) => setNewJobRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmNewSession()}
              placeholder="e.g. Software Engineer"
              className="w-full px-4 py-3 bg-slate-900/60 border border-blue-800/40 text-white placeholder-blue-300/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="flex-1 bg-slate-700/60 text-blue-200 py-2.5 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmNewSession}
                disabled={!newJobRole.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
