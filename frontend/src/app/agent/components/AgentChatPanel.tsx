'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { AgentConversationItem } from '../types';
import { sendAgentMessage } from '../agentService';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  PaperClipIcon,
  SparklesIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AgentChatPanelProps {
  conversations: AgentConversationItem[];
  loading: boolean;
  onConversationsUpdate: (msgs: AgentConversationItem[]) => void;
}

const QUICK_PROMPTS = [
  'Tổng hợp các phòng đang trống',
  'Liệt kê khách thuê còn nợ tiền',
  'Hợp đồng nào sắp hết hạn trong 30 ngày tới?',
  'Tóm tắt chi phí tháng này',
  'Gợi ý bài đăng để lấp đầy phòng trống',
  'Cho tôi báo cáo nhanh tình hình vận hành tuần này',
];

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function AgentChatPanel({ conversations, loading, onConversationsUpdate }: AgentChatPanelProps) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, sending]);

  const handleSend = async (message?: string) => {
    const text = (message ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    const userMsg: AgentConversationItem = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      messageType: 'text',
    };
    onConversationsUpdate([...conversations, userMsg]);

    try {
      const assistantMsg = await sendAgentMessage(text);
      onConversationsUpdate([...conversations, userMsg, assistantMsg]);
    } catch {
      const errMsg: AgentConversationItem = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
        createdAt: new Date().toISOString(),
        messageType: 'text',
      };
      onConversationsUpdate([...conversations, userMsg, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col" style={{ minHeight: '520px', maxHeight: '680px' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
          <p className="text-xs text-teal-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full inline-block" />
            Đang hoạt động · Kết nối mock
          </p>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-50">
        <p className="text-xs text-slate-400 mb-2 font-medium">Gợi ý nhanh:</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={sending}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 border border-slate-200 text-slate-600 rounded-full transition-colors disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-12 rounded-2xl animate-pulse ${i % 2 === 0 ? 'bg-teal-100 w-48' : 'bg-slate-100 w-64'}`} />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <SparklesIcon className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400">Chưa có cuộc trò chuyện nào</p>
            <p className="text-xs text-slate-300 mt-1">Hãy đặt câu hỏi hoặc chọn gợi ý bên trên</p>
          </div>
        ) : (
          conversations.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ?'bg-teal-600 text-white rounded-tr-sm' :'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  {/* Render bold markdown-like */}
                  <p dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }} />
                  {msg.listItems && msg.listItems.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {msg.listItems.map((item, idx) => (
                        <li key={idx} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {msg.suggestedActions.map((action, idx) => (
                      action.href ? (
                        <Link
                          key={idx}
                          href={action.href}
                          className="text-xs px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <button
                          key={idx}
                          className="text-xs px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
                        >
                          {action.label}
                        </button>
                      )
                    ))}
                  </div>
                )}
                <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
        <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-teal-400 focus-within:ring-1 focus-within:ring-teal-400/30 transition-all">
          <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mb-0.5" title="Đính kèm tệp (mock)">
            <PaperClipIcon className="w-4 h-4" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập yêu cầu hoặc câu hỏi về nhà trọ..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none resize-none max-h-28 scrollbar-thin"
            style={{ minHeight: '24px' }}
          />
          <div className="flex items-center gap-1 flex-shrink-0 mb-0.5">
            <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors" title="Nhập giọng nói (mock)">
              <MicrophoneIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">AI đang dùng mock data · Nhấn Enter để gửi</p>
      </div>
    </div>
  );
}
