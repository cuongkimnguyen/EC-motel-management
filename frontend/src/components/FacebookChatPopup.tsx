'use client';

import { useState, useRef, useEffect } from 'react';
import { mockConversations, mockRooms, ChatConversation, ChatMessage, formatCurrency } from '@/lib/mockData';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  PhoneIcon,
  TagIcon,
  XCircleIcon,
  UserIcon,
  HomeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  StarIcon,
  CheckIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

// ─── Facebook Icon (SVG inline since heroicons doesn't have Facebook) ─────────
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

// ─── Lead Status Badge ────────────────────────────────────────────────────────
function LeadBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Mới': 'bg-slate-100 text-slate-600',
    'Đang tư vấn': 'bg-blue-100 text-blue-700',
    'Quan tâm cao': 'bg-amber-100 text-amber-700',
    'Đã chốt': 'bg-emerald-100 text-emerald-700',
    'Không quan tâm': 'bg-red-100 text-red-700',
  };
  return <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

// ─── Interest Level ───────────────────────────────────────────────────────────
function InterestLevel({ level }: { level: string }) {
  const stars = level === 'Rất cao' ? 4 : level === 'Cao' ? 3 : level === 'Trung bình' ? 2 : 1;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <StarIcon key={i} className={`w-3 h-3 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{level}</span>
    </div>
  );
}

// ─── Tag Badge ────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const map: Record<string, string> = {
    'Hỏi phòng': 'bg-blue-50 text-blue-600 border-blue-200',
    'Xin giá': 'bg-purple-50 text-purple-600 border-purple-200',
    'Hẹn xem phòng': 'bg-amber-50 text-amber-600 border-amber-200',
    'Quan tâm thuê phòng': 'bg-teal-50 text-teal-600 border-teal-200',
    'Đã chốt': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full text-[10px] font-medium px-1.5 py-0.5 border ${map[tag] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {tag}
    </span>
  );
}

// ─── Quick Replies ────────────────────────────────────────────────────────────
const quickReplies = [
  'Phòng này hiện còn ạ',
  'Anh/chị cho em xin số điện thoại nhé',
  'Mình có thể qua xem phòng hôm nay',
  'Giá phòng hiện tại là...',
  'Em gửi mình thông tin chi tiết ạ',
];

// ─── Main Chat Popup ──────────────────────────────────────────────────────────
export default function FacebookChatPopup() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>(mockConversations);
  const [activeConvId, setActiveConvId] = useState<string>('cv1');
  const [convFilter, setConvFilter] = useState('Tất cả');
  const [convSearch, setConvSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const convFilters = ['Tất cả', 'Chưa đọc', 'Chưa trả lời', 'Quan tâm thuê phòng', 'Đã chốt'];

  const filteredConvs = conversations.filter(c => {
    if (convSearch && !c.customerName.toLowerCase().includes(convSearch.toLowerCase())) return false;
    if (convFilter === 'Chưa đọc' && c.unreadCount === 0) return false;
    if (convFilter === 'Chưa trả lời') {
      const lastMsg = c.messages[c.messages.length - 1];
      if (!lastMsg || lastMsg.sender !== 'customer') return false;
    }
    if (convFilter === 'Quan tâm thuê phòng' && !c.tags.includes('Quan tâm thuê phòng')) return false;
    if (convFilter === 'Đã chốt' && c.leadStatus !== 'Đã chốt') return false;
    return true;
  });

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [open, activeConvId]);

  const handleSelectConv = (id: string) => {
    setActiveConvId(id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      conversationId: activeConvId,
      sender: 'staff',
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setConversations(prev => prev.map(c =>
      c.id === activeConvId
        ? { ...c, messages: [...c.messages, newMsg], lastMessage: inputText.trim(), lastTime: 'Vừa xong' }
        : c
    ));
    setInputText('');
    setShowQuickReplies(false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const suggestedRooms = mockRooms.filter(r => r.status === 'Trống').slice(0, 3);

  return (
    <>
      {/* Floating Launcher */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setOpen(!open)}
          className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
          aria-label="Mở hộp thư Facebook"
        >
          {open ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />}
          {!open && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      </div>

      {/* Chat Popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[900px] max-w-[calc(100vw-3rem)] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex overflow-hidden">

          {/* LEFT: Conversation List */}
          <div className="w-64 flex-shrink-0 border-r border-slate-100 flex flex-col bg-white">
            {/* Header */}
            <div className="px-3 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <FacebookIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-900">Hộp thư</span>
                  {totalUnread > 0 && (
                    <span className="text-xs font-bold text-white bg-red-500 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{totalUnread}</span>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tìm hội thoại..."
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-2 py-2 border-b border-slate-100 flex flex-wrap gap-1">
              {convFilters.map(f => (
                <button
                  key={f}
                  onClick={() => setConvFilter(f)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                    convFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`w-full flex items-start gap-2.5 px-3 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left ${
                    activeConvId === conv.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {conv.customerAvatar}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border border-white flex items-center justify-center">
                      <FacebookIcon className="w-1.5 h-1.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold truncate ${conv.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {conv.customerName}
                      </p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">{conv.lastTime}</span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                      {conv.lastMessage}
                    </p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {conv.tags.slice(0, 1).map(tag => <TagBadge key={tag} tag={tag} />)}
                      {conv.unreadCount > 0 && (
                        <span className="ml-auto w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: Chat Messages */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {activeConv?.customerAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activeConv?.customerName}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5">
                      <FacebookIcon className="w-2.5 h-2.5" /> Facebook Page
                    </span>
                    <LeadBadge status={activeConv?.leadStatus || 'Mới'} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Gọi điện">
                  <PhoneIcon className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Gắn nhãn">
                  <TagIcon className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Đóng hội thoại">
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {/* Date separator */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400 font-medium px-2">Hôm nay</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {activeConv?.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'customer' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-auto">
                      {activeConv.customerAvatar}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${msg.sender === 'staff' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'staff' ?'bg-blue-600 text-white rounded-br-sm' :'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 mt-0.5 ${msg.sender === 'staff' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      {msg.sender === 'staff' && (
                        <CheckIcon className="w-3 h-3 text-blue-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {showQuickReplies && (
              <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => { setInputText(reply); setShowQuickReplies(false); }}
                    className="text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-2.5 py-1 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="px-3 py-3 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                  title="Trả lời nhanh"
                >
                  <BoltIcon className="w-4 h-4" />
                </button>
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                  placeholder="Nhập trả lời..."
                />
                <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"><FaceSmileIcon className="w-4 h-4" /></button>
                <button className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"><PaperClipIcon className="w-4 h-4" /></button>
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Lead Context */}
          <div className="w-64 flex-shrink-0 border-l border-slate-100 flex flex-col bg-white overflow-y-auto">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Thông tin lead</h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Lead Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Trạng thái lead</span>
                  <LeadBadge status={activeConv?.leadStatus || 'Mới'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Mức độ quan tâm</span>
                  <InterestLevel level={activeConv?.interestLevel || 'Thấp'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Nguồn</span>
                  <span className="text-xs font-medium text-blue-600 flex items-center gap-1"><FacebookIcon className="w-2.5 h-2.5" /> Facebook</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2.5">
                {activeConv?.phone && (
                  <div className="flex items-start gap-2">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">SĐT</p>
                      <p className="text-xs font-medium text-slate-900">{activeConv.phone}</p>
                    </div>
                  </div>
                )}
                {activeConv?.interestedRoom && (
                  <div className="flex items-start gap-2">
                    <HomeIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Phòng quan tâm</p>
                      <p className="text-xs font-medium text-slate-900">{activeConv.interestedRoom}</p>
                    </div>
                  </div>
                )}
                {activeConv?.budget && activeConv.budget > 0 && (
                  <div className="flex items-start gap-2">
                    <CurrencyDollarIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Ngân sách</p>
                      <p className="text-xs font-medium text-slate-900">{formatCurrency(activeConv.budget)}/tháng</p>
                    </div>
                  </div>
                )}
                {activeConv?.appointmentDate && (
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Ngày hẹn xem</p>
                      <p className="text-xs font-medium text-slate-900">{activeConv.appointmentDate}</p>
                    </div>
                  </div>
                )}
                {activeConv?.internalNote && (
                  <div className="flex items-start gap-2">
                    <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Ghi chú nội bộ</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{activeConv.internalNote}</p>
                    </div>
                  </div>
                )}
                {activeConv?.assignee && (
                  <div className="flex items-start gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400">Nhân viên phụ trách</p>
                      <p className="text-xs font-medium text-slate-900">{activeConv.assignee}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {activeConv?.tags && activeConv.tags.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] text-slate-400 mb-2">Nhãn</p>
                  <div className="flex flex-wrap gap-1">
                    {activeConv.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
                  </div>
                </div>
              )}

              {/* Suggested Rooms */}
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">Phòng gợi ý</p>
                <div className="space-y-2">
                  {suggestedRooms.map(room => (
                    <div key={room.id} className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-slate-900">{room.code}</p>
                        <span className="text-[10px] text-emerald-600 font-medium">Trống</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{room.area}m² · {room.block}</p>
                      <p className="text-xs font-medium text-teal-700 mt-0.5">{formatCurrency(room.rentPrice)}/tháng</p>
                      <button className="w-full mt-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <PaperAirplaneIcon className="w-2.5 h-2.5" /> Gửi phòng này
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
