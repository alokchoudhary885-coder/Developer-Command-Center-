import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { api } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Show PR review bottlenecks waiting >24 hours',
  'Generate today\'s standup summary for the team',
  'What is our current DORA Lead Time & MTTR status?',
  'List open blockers and critical issues across all repos',
  'Generate an executive sprint summary with DORA metrics, PR velocity, and action items',
  'Which repos have the most open issues and what should we prioritize?',
];


export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '👋 Hello! I am your **AI Engineering Copilot** powered by Google Gemini.\n\nI have real-time access to your synced GitHub repositories, pull request review bottlenecks, DORA performance benchmarks, and deployment health telemetry.\n\nHow can I accelerate your engineering workflow today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', { query: questionText });
      const aiResponse = res.data.answer || 'I could not find an answer for that query.';

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: '❌ **Error:** Unable to process AI query. Please verify your connection or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5 font-mono">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <li key={idx} className="text-xs text-slate-200 ml-4 list-disc my-1 leading-relaxed">
            <span
              dangerouslySetInnerHTML={{
                __html: line
                  .replace(/^[•-]\s*/, '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>')
                  .replace(/`(.*?)`/g, '<code class="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-mono text-[11px] border border-purple-500/30">$1</code>'),
              }}
            />
          </li>
        );
      }
      if (line.startsWith('💡 ')) {
        return (
          <div key={idx} className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs text-purple-200 my-2.5 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span
              dangerouslySetInnerHTML={{
                __html: line
                  .replace('💡 ', '')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-purple-300 font-bold">$1</strong>'),
              }}
            />
          </div>
        );
      }
      if (!line.trim()) return <div key={idx} className="h-1.5" />;

      return (
        <p
          key={idx}
          className="text-xs text-slate-200 my-1 leading-relaxed font-sans"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-slate-400">$1</em>')
              .replace(/`(.*?)`/g, '<code class="bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded font-mono text-[11px] border border-purple-500/30">$1</code>'),
          }}
        />
      );
    });
  };

  return (
    <PageContainer
      title="AI Engineering Productivity Assistant"
      description="Natural language queries against your real-time software engineering telemetry."
      action={
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Gemini 1.5 Flash Active</span>
        </div>
      }
    >
      <div className="flex flex-col h-[calc(100vh-14rem)] bg-[#0c1532]/75 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden select-none">
        {/* 1. Quick Prompts Ribbon */}
        <div className="p-3 border-b border-white/10 bg-white/5 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5 pl-2">
            <Zap className="w-3.5 h-3.5" />
            Quick Prompts:
          </span>
          <div className="flex items-center gap-2">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="shrink-0 px-3 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Messages Chat Box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <span className="text-xs font-bold font-mono">YOU</span>
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-[#091024]/90 border border-white/10 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div>{renderFormattedMarkdown(msg.text)}</div>
                )}
                <span
                  className={`block text-[10px] font-mono mt-2 text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 mr-auto max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="p-4 rounded-2xl bg-[#091024]/90 border border-white/10 flex items-center gap-2 text-xs text-purple-300 shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                <span>Gemini is analyzing engineering telemetry...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* 3. Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(query);
          }}
          className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Ask about PR bottlenecks, standup summaries, issue SLAs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 font-mono"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-purple-600/30"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </PageContainer>
  );
};
