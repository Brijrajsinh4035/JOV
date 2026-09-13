import React, { useState, useEffect, useRef } from 'react';
import { aiApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button/Button';
import Spinner from '../../components/common/Spinner/Spinner';
import MarkdownView from '../../components/common/MarkdownView';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  User,
  Wrench,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Activity,
} from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  { prompt: 'What is the current status and budget utilization of our ongoing infrastructure schemes?' },
  { prompt: 'What are the compliance rules for earnest money deposits (EMD) under GFR 2017?' },
  { prompt: 'How do we calculate Schedule Performance Index (SPI) and Cost Performance Index (CPI)?' },
  { prompt: 'Give a milestone inspection checklist for highway and bridge construction projects.' },
  { prompt: 'What are the required approvals for Revised Cost Estimates (RCE) above 20%?' },
];

const DEFAULT_WELCOME_MESSAGE = {
  id: 'welcome',
  sender: 'assistant',
  text: `Namaste! I am your **Government Project Management Assistant AI**.\n\nI provide specialized advisory on:\n- **Scheme Tracking & Budgets**: Real-time progress, fund sanctions, and utilization rates.\n- **GFR 2017 & Procurement**: E-tendering, EMD, security deposits, and contract guidelines.\n- **Milestones & Risks**: Delivery gates, physical inspection criteria, and risk mitigation.\n- **Earned Value Analysis**: CPI, SPI, and schedule variance calculations with practical examples.\n\n*Note: I strictly answer questions related to government project management only.* How may I assist your department today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  toolsUsed: [],
};

const AiAssistantPage = () => {
  const { user } = useAuth();
  const userKey = user?._id || user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
  const userStorageKey = userKey ? `pmo_ai_chat_${String(userKey).replace(/[^a-zA-Z0-9_-]/g, '_')}` : null;

  const [messages, setMessages] = useState(() => {
    // Purge obsolete shared key to prevent data leak across users
    try {
      localStorage.removeItem('pmo_ai_chat_messages_v1');
    } catch (_) {}

    if (userStorageKey) {
      try {
        const saved = localStorage.getItem(userStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not restore chat history from localStorage:', e);
      }
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [copiedId, setCopiedId] = useState(null);
  const [showDomainDetails, setShowDomainDetails] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch categorized prompt suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await aiApi.getSuggestions();
        const data = res?.data || res;
        if (Array.isArray(data) && data.length > 0) {
          setSuggestions(data);
        }
      } catch (err) {
        console.warn('Using default suggestions:', err.message);
      }
    };
    fetchSuggestions();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Synchronize chat history when logged-in user changes
  useEffect(() => {
    if (!userStorageKey) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      return;
    }
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not restore chat history from localStorage:', e);
    }
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  }, [userStorageKey]);

  // Persist messages to localStorage on update scoped to user
  useEffect(() => {
    if (!userStorageKey) return;
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(userStorageKey, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Could not persist chat history to localStorage:', e);
    }
  }, [messages, userStorageKey]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        sender: 'user',
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    setMessages(newMessages);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Build history for multi-turn assistant context
      const historyPayload = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await aiApi.chat(query, historyPayload);
      const data = res?.data || res;

      const aiReply =
        data?.reply ||
        'I have evaluated your government project management query according to current guidelines.';
      const toolsUsed = data?.toolsUsed || [];

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: aiReply,
          toolsUsed,
          model: data?.model || 'gemini-3.6-flash',
          liveAi: data?.liveAi,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `⚠️ **Connection Error**: ${err.message || 'Unable to contact the AI Assistant service. Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    const resetMsg = [
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: 'Chat history cleared. Please ask any query regarding government project monitoring, budgets, tenders, milestones, or risks.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: [],
      },
    ];
    setMessages(resetMsg);
    try {
      if (userStorageKey) {
        localStorage.removeItem(userStorageKey);
      }
      localStorage.removeItem('pmo_ai_chat_messages_v1');
    } catch (e) {
      console.warn('Could not clear chat history from localStorage:', e);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 w-full max-w-6xl mx-auto gap-2 sm:gap-2.5">
      {/* Sleek Government AI Console Header */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-xs border border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-xs shrink-0">
            <Bot size={22} className="text-slate-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate">
                Government Project Management Assistant AI
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Advisor
                </span>
                <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  gemini-3.6-flash
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 hidden sm:block truncate">
              Public scheme tracking • GFR 2017 procurement • Milestone verification • Risk mitigation
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowDomainDetails((prev) => !prev)}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            title="View Domain Enforcement Guidelines"
          >
            <ShieldCheck size={13} className="text-blue-400" />
            <span className="hidden sm:inline">Scope</span>
            {showDomainDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            title="Clear current chat session"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Collapsible / Expandable Domain Scope Notice */}
      {showDomainDetails && (
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 shrink-0 transition-all shadow-2xs">
          <div className="flex items-start gap-2">
            <ShieldCheck size={15} className="text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950 dark:text-blue-100">
                Government PM Domain Guardrails & Persona
              </p>
              <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                This AI strictly adheres to Indian Public Project Management standards (GFR 2017, GeM procurement, CPWD/MoRTH specs, and NITI Aayog guidelines). Queries outside infrastructure, budgets, tenders, compliance, or milestones are declined. Every advisory response provides concise guidance followed by an actionable practical implementation example.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Thread Box */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/30 scroll-smooth">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot size={16} className="text-amber-400" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-3 sm:p-4 text-xs sm:text-sm shadow-xs transition-all ${
                    isUser
                      ? 'bg-blue-900 text-white rounded-tr-xs font-medium'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] sm:text-[11px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className={isUser ? 'text-blue-200' : 'text-blue-900 dark:text-blue-400 font-extrabold'}>
                        {isUser ? 'Nodal Officer (You)' : 'Government Project Assistant'}
                      </span>
                      {!isUser && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {msg.model || 'gemini-3.6-flash'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={isUser ? 'text-blue-300' : 'text-slate-400 font-mono'}>
                        {msg.timestamp}
                      </span>
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <Check size={13} className="text-emerald-500" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div>
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-white">{msg.text}</p>
                    ) : (
                      <MarkdownView content={msg.text} />
                    )}
                  </div>

                  {/* Tools Invoked Indicator */}
                  {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap text-[10px]">
                      <span className="text-slate-400 font-semibold flex items-center gap-1">
                        <Wrench size={11} className="text-amber-500" /> PMIS Tools Invoked:
                      </span>
                      {msg.toolsUsed.map((tool, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-slate-800 font-mono text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-slate-700 shadow-2xs"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User size={16} className="text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Thinking / Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot size={16} className="text-amber-400" />
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-xs px-3.5 py-3 shadow-xs flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Spinner size="sm" />
                <span className="animate-pulse font-medium">
                  Evaluating PM Guidelines & Live Project Database...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Pills (Horizontal Scrollable) */}
        {suggestions.length > 0 && (
          <div className="px-3.5 py-2 bg-slate-100/90 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Suggested:
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(s.prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-900 dark:hover:text-blue-300 text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 shrink-0"
              >
                {s.prompt}
              </button>
            ))}
          </div>
        )}

        {/* Pinned Bottom Chat Input Bar */}
        <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about scheme status, budgets, GFR 2017 procurement, milestones, or risks..."
                disabled={isLoading}
                className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium shadow-inner-xs"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || !inputQuery.trim()}
              isLoading={isLoading}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
          </form>

          {/* Quick Shortcuts & Domain Compliance Caption */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
            <span className="hidden xs:inline">Press Enter ↵ to send • Shift + Enter for new line</span>
            <span className="flex items-center gap-1 ml-auto text-slate-400">
              <ShieldCheck size={11} className="text-emerald-500" />
              <span>GFR 2017 & Public PMIS Verified</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
