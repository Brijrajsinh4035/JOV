import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiApi } from '../../api';
import { useAuth } from '../../hooks/useAuth';
import Spinner from './Spinner/Spinner';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Maximize2,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  Zap,
} from 'lucide-react';

const DEFAULT_WIDGET_INIT = {
  id: 'init',
  sender: 'assistant',
  text: 'Namaste Officer! Ask me anything about ongoing scheme status, budgets, GFR procurement, milestones, or risks.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const AiAssistantWidget = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userKey = user?._id || user?.id || (user?.email ? user.email.toLowerCase().trim() : null);
  const widgetStorageKey = userKey ? `pmo_ai_widget_${String(userKey).replace(/[^a-zA-Z0-9_-]/g, '_')}` : null;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      localStorage.removeItem('pmo_ai_widget_messages_v1');
    } catch (_) {}

    if (widgetStorageKey) {
      try {
        const saved = localStorage.getItem(widgetStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not load widget history:', e);
      }
    }
    return [DEFAULT_WIDGET_INIT];
  });
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Synchronize messages when user changes
  useEffect(() => {
    if (!widgetStorageKey) {
      setMessages([DEFAULT_WIDGET_INIT]);
      return;
    }
    try {
      const saved = localStorage.getItem(widgetStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not load widget history:', e);
    }
    setMessages([DEFAULT_WIDGET_INIT]);
  }, [widgetStorageKey]);

  // Persist messages to localStorage scoped to user
  useEffect(() => {
    if (!widgetStorageKey) return;
    try {
      if (messages && messages.length > 0) {
        localStorage.setItem(widgetStorageKey, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Could not save widget history:', e);
    }
  }, [messages, widgetStorageKey]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

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
      const historyPayload = newMessages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await aiApi.chat(query, historyPayload);
      const data = res?.data || res;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data?.reply || 'Analyzed according to Government Project Management guidelines.',
          toolsUsed: data?.toolsUsed || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Notice**: ${err.message || 'Unable to connect to AI Assistant.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'What is the status of active schemes?',
    'GFR rules for open e-tenders & EMD?',
    'What are the critical risks recorded?',
  ];

  // Hide floating widget when user is already on the dedicated full-screen AI Assistant page
  if (location.pathname.startsWith('/ai-assistant')) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Floating Expanded Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[520px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Widget Header */}
          <div className="p-3.5 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">Project AI Assistant</h3>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300">Govt PM Advisory & Live Data</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-assistant');
                }}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Open full page"
              >
                <Maximize2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMessages([
                    {
                      id: 'reset',
                      sender: 'assistant',
                      text: 'Chat cleared. Ask about project status, budgets, tenders, or risks.',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    },
                  ]);
                  try {
                    if (widgetStorageKey) {
                      localStorage.removeItem(widgetStorageKey);
                    }
                    localStorage.removeItem('pmo_ai_widget_messages_v1');
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Scope Note */}
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900 text-[10px] text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
            <ShieldCheck size={12} className="shrink-0 text-blue-700 dark:text-blue-400" />
            <span>Strictly responds to government project management only.</span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isUser
                        ? 'bg-blue-900 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs whitespace-pre-wrap'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.timestamp}</span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-2 text-xs text-slate-500 dark:text-slate-400">
                <Spinner size="xs" />
                <span className="text-[11px] animate-pulse">Evaluating project data...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-3 py-2 bg-slate-100/70 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((q, qIdx) => (
              <button
                key={qIdx}
                type="button"
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-medium hover:border-blue-500 transition-colors whitespace-nowrap cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask project question..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="w-8 h-8 rounded-xl bg-blue-900 hover:bg-blue-950 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Launcher Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-900 to-slate-900 hover:from-blue-950 hover:to-black text-white shadow-lg hover:shadow-xl border border-blue-700/50 flex items-center gap-2 cursor-pointer transition-all duration-200"
      >
        <div className="relative">
          <Bot size={18} className="text-amber-400" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-bold tracking-wide">
          {isOpen ? 'Close Assistant' : 'AI Project Assistant'}
        </span>
      </button>
    </div>
  );
};

export default AiAssistantWidget;
