'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Copy,
  Check,
  FileText,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: "Hi! Ask me about exam dates, official circulars, lab access, or campus events.",
    timestamp: 'Just now',
  },
];

const SUGGESTED_CHIPS = [
  { label: "Today's Notices", prompt: 'What are the most important notices and announcements today?' },
  { label: 'Upcoming Events', prompt: 'What student events and club activities are coming up this week?' },
  { label: 'Exam Schedule', prompt: 'Summarize the latest administrative notice regarding examination dates.' },
];

export default function CampusAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageCounterRef = useRef(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || isLoading) return;

    const nextId = messageCounterRef.current++;
    const userMsg: ChatMessage = {
      id: `usr-${nextId}`,
      role: 'user',
      content: promptText,
      timestamp: 'Now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyId = messageCounterRef.current++;
        const assistantMsg: ChatMessage = {
          id: `ai-${replyId}`,
          role: 'assistant',
          content: data.reply || 'Here is the campus information matching your query.',
          timestamp: 'Now',
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('AI API responded with error');
      }
    } catch (err) {
      console.warn('AI query error:', err);
      const fallbackReply =
        "I'm unable to retrieve verified campus records at the moment. Please try asking again in a few moments.";

      const fallbackId = messageCounterRef.current++;
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${fallbackId}`,
          role: 'assistant',
          content: fallbackReply,
          timestamp: 'Now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  // Listen for custom trigger from anywhere in the app with optional prefilled prompt and context
  useEffect(() => {
    const handleOpenTrigger = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string; contextTitle?: string }>;
      setIsOpen(true);
      if (customEvent.detail?.contextTitle) {
        setActiveContext(customEvent.detail.contextTitle);
      }
      if (customEvent.detail?.prompt) {
        handleSendMessage(customEvent.detail.prompt);
      }
    };
    window.addEventListener('open-campus-ai', handleOpenTrigger);
    return () => window.removeEventListener('open-campus-ai', handleOpenTrigger);
  }, [handleSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-6 right-3 sm:right-6 z-30 flex flex-col items-end">
      {/* AI Panel (60-70dvh on mobile, never covers MobileNav) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Campus AI Assistant"
          className="mb-2 sm:mb-3 w-[calc(100vw-24px)] sm:w-[380px] h-[65dvh] sm:h-[490px] max-h-[550px] surface-ai-panel rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* Atmospheric Header: Dark gradient with coral/indigo presence */}
          <div className="px-3.5 py-3 bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#1E293B] border-b border-white/10 flex items-center justify-between shrink-0 relative overflow-hidden">
            {/* Subtle atmospheric ambient glow inside header */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#FF6848]/20 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-[#6366F1]/20 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-2.5 min-w-0 relative z-10">
              <div className="w-7 h-7 rounded-lg bg-[#FF6848] text-white flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(255,104,72,0.5)]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-ai text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Campus AI</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-orange-200 border border-white/10 font-normal">Intelligence</span>
                </h3>
                <span className="text-[10px] text-slate-300">Official campus knowledge layer</span>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setMessages(INITIAL_MESSAGES);
                  setActiveContext(null);
                }}
                aria-label="Reset Conversation"
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Assistant"
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context indicator chip if explaining a specific notice */}
          {activeContext && (
            <div className="px-3 py-1.5 bg-[#FFF1EC] border-b border-[#FFD2C6]/60 flex items-center justify-between text-xs text-[#FF6848] shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold truncate">Context: {activeContext}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveContext(null)}
                className="text-[11px] hover:underline text-[#B45309] font-medium shrink-0 ml-2 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-surface/40 text-xs overscroll-contain">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed font-medium ${
                      isAssistant
                        ? 'bg-surface text-primary border border-subtle shadow-2xs'
                        : 'bg-[#FF6848] text-white shadow-2xs font-bold'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                    {isAssistant && msg.content.includes('official circular') && (
                      <div className="mt-2.5 pt-2 border-t border-subtle">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            window.dispatchEvent(
                              new CustomEvent('open-pdf-modal', {
                                detail: { fileName: 'circular_endsem_schedule_latest.pdf' },
                              })
                            );
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-surface hover:bg-brand-surface/80 text-[#FF6848] text-[11px] font-bold border border-brand-border transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View official circular</span>
                        </button>
                      </div>
                    )}
                  </div>
                  {isAssistant && (
                    <div className="flex items-center gap-2 mt-0.5 px-1 text-[10px] text-muted font-semibold">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-primary flex items-center gap-1 mt-0.5 cursor-pointer"
                        aria-label="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted p-2 bg-surface rounded-lg border border-subtle w-fit font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6848] animate-spin" />
                <span>Checking verified campus records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div className="px-2.5 py-1.5 bg-surface/90 border-t border-subtle flex flex-wrap gap-1 shrink-0">
              {SUGGESTED_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  disabled={isLoading}
                  className="text-[11px] px-2.5 py-1 bg-surface-muted hover:bg-brand-surface hover:text-[#FF6848] text-secondary border border-subtle rounded-md transition text-left cursor-pointer font-semibold"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-2.5 bg-surface/90 border-t border-subtle flex items-center gap-1.5 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about notices, exams, or events..."
              disabled={isLoading}
              className="flex-1 bg-surface-muted border border-subtle focus:border-[#FF6848] focus:bg-surface rounded-lg px-2.5 py-1.5 text-xs outline-none text-primary placeholder:text-muted font-medium"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="w-8 h-8 rounded-lg bg-[#FF6848] hover:bg-[#E95739] text-white flex items-center justify-center transition disabled:opacity-40 shrink-0 cursor-pointer shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Launcher with safe-area spacing & atmospheric aura */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close Campus AI' : 'Open Campus AI'}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-elevated text-primary border border-brand-border shadow-[0_4px_16px_rgba(255,104,72,0.18)] transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF6848] cursor-pointer ring-1 ring-[#FF6848]/15"
      >
        <Sparkles className="w-4 h-4 text-[#FF6848]" />
        <span className="text-xs font-bold font-ai hidden xs:inline">
          {isOpen ? 'Close AI' : 'Campus AI'}
        </span>
      </button>
    </div>
  );
}
