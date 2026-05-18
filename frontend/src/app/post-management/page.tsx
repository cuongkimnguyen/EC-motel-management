'use client';

import { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { mockPosts, mockRooms, FacebookPost, PostStatus, formatCurrency, formatDate, getPostStatusColor } from '@/lib/mockData';
import { MagnifyingGlassIcon, PlusIcon, Squares2X2Icon, ListBulletIcon, EllipsisVerticalIcon, XMarkIcon, EyeIcon, PencilIcon, DocumentDuplicateIcon, PaperAirplaneIcon, CalendarIcon, TrashIcon, ArrowTopRightOnSquareIcon, ChartBarIcon, ArrowTrendingUpIcon, ChatBubbleOvalLeftEllipsisIcon, UsersIcon, AdjustmentsHorizontalIcon, PercentBadgeIcon, PhotoIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Status Badge ─────────────────────────────────────────────────────────────
function PostStatusBadge({ status }: { status: PostStatus }) {
  const color = getPostStatusColor(status);
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 whitespace-nowrap ${color}`}>
      {status}
    </span>
  );
}

// ─── Channel Badge ────────────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  const map: Record<string, string> = {
    'Facebook Page': 'bg-blue-100 text-blue-700',
    'Facebook Group': 'bg-indigo-100 text-indigo-700',
    'Zalo': 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5 ${map[channel] || 'bg-slate-100 text-slate-600'}`}>
      {channel}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, icon, color, sub }: { label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-emerald-600 font-medium mt-1">{sub}</p>}
    </div>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────
function PostRowActions({ post, onView, onEdit, onDelete }: {
  post: FacebookPost;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = [
    { icon: <EyeIcon className="w-3.5 h-3.5" />, label: 'Xem', action: onView },
    { icon: <PencilIcon className="w-3.5 h-3.5" />, label: 'Sửa', action: onEdit },
    { icon: <DocumentDuplicateIcon className="w-3.5 h-3.5" />, label: 'Nhân bản', action: () => {} },
    { icon: <PaperAirplaneIcon className="w-3.5 h-3.5" />, label: 'Đăng ngay', action: () => {} },
    { icon: <CalendarIcon className="w-3.5 h-3.5" />, label: 'Lên lịch', action: () => {} },
    { icon: <TrashIcon className="w-3.5 h-3.5" />, label: 'Xóa', action: onDelete, danger: true },
  ];
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {items.map((item, i) => (
              <button key={i} onClick={() => { item.action(); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}>
                <span className={item.danger ? 'text-red-400' : 'text-slate-400'}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Create Post Modal ────────────────────────────────────────────────────────
function CreatePostModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '',
    postType: 'Tuyển khách',
    channel: 'Facebook Page',
    room: '',
    content: '',
    hashtags: '',
    price: '',
    area: '',
    amenities: '',
    address: '',
    phone: '0901234567',
    scheduledDate: '',
    assignee: 'Nguyễn Văn Chủ',
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const previewContent = form.content || 'Nội dung bài đăng sẽ hiển thị ở đây...';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tạo bài đăng mới</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><XMarkIcon className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tiêu đề bài đăng <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => set('title', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="VD: Cho thuê phòng P103 - Khu A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Loại bài đăng</label>
                  <select value={form.postType} onChange={e => set('postType', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Tuyển khách</option>
                    <option>Khuyến mãi</option>
                    <option>Thông báo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Kênh đăng</label>
                  <select value={form.channel} onChange={e => set('channel', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Facebook Page</option>
                    <option>Facebook Group</option>
                    <option>Zalo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Phòng liên kết</label>
                  <select value={form.room} onChange={e => set('room', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">-- Chọn phòng --</option>
                    {mockRooms.filter(r => r.status === 'Trống').map(r => (
                      <option key={r.id} value={r.code}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Người phụ trách</label>
                  <select value={form.assignee} onChange={e => set('assignee', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option>Nguyễn Văn Chủ</option>
                    <option>Trần Thị Mai</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Nội dung bài viết <span className="text-red-500">*</span></label>
                <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={5} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Nhập nội dung bài đăng..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Giá thuê (VND)</label>
                  <input value={form.price} onChange={e => set('price', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="3500000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Diện tích (m²)</label>
                  <input value={form.area} onChange={e => set('area', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="25" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Tiện ích</label>
                <input value={form.amenities} onChange={e => set('amenities', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Wifi, điều hòa, tủ lạnh, máy giặt..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Địa chỉ</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Đường Nguyễn Trãi, Q.Thanh Xuân" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">SĐT liên hệ</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Hashtags</label>
                <input value={form.hashtags} onChange={e => set('hashtags', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="#chothuephong #nhatro #HaNoi" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Upload hình ảnh</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-teal-400 transition-colors cursor-pointer">
                  <PhotoIcon className="w-20 h-20 mx-auto text-slate-400 mb-1.5" />
                  <p className="text-sm text-slate-500">Kéo thả hoặc <span className="text-teal-600 font-medium">chọn ảnh</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">Tối đa 10 ảnh, mỗi ảnh 5MB</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Lịch đăng</label>
                <input type="datetime-local" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-80 flex-shrink-0 overflow-y-auto p-6 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Xem trước bài đăng</p>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* FB Page header */}
              <div className="p-3 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Nhà trọ MotelManage</p>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <ClockIcon className="w-2.5 h-2.5" /> Vừa xong · <span>🌐</span>
                  </div>
                </div>
              </div>
              {/* Content */}
              <div className="px-3 pb-3">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {previewContent}
                </p>
                {form.hashtags && (
                  <p className="text-sm text-blue-600 mt-2">{form.hashtags}</p>
                )}
              </div>
              {/* Image placeholder */}
              <div className="bg-slate-100 h-40 flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <PhotoIcon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs">Hình ảnh phòng</p>
                </div>
              </div>
              {/* CTA */}
              <div className="p-3 border-t border-slate-100">
                <div className="bg-slate-100 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500">Nhà trọ MotelManage</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{form.title || 'Tiêu đề bài đăng'}</p>
                  {form.price && <p className="text-xs text-teal-600 font-medium">{formatCurrency(parseInt(form.price) || 0)}/tháng</p>}
                </div>
                <button className="w-full mt-2 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg">
                  Nhắn tin ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <DocumentTextIcon className="w-3.5 h-3.5" /> Lưu nháp
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Hủy</button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              <CalendarIcon className="w-3.5 h-3.5" /> Lên lịch đăng
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
              <PaperAirplaneIcon className="w-3.5 h-3.5" /> Đăng ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Section ────────────────────────────────────────────────────────
const weeklyData = [
  { week: 'T2/3', posts: 2 }, { week: 'T3/3', posts: 1 }, { week: 'T4/3', posts: 3 },
  { week: 'T5/3', posts: 2 }, { week: 'T6/3', posts: 4 }, { week: 'T7/3', posts: 1 }, { week: 'CN', posts: 0 },
];
const inboxData = [
  { day: '08/3', inbox: 5 }, { day: '09/3', inbox: 8 }, { day: '10/3', inbox: 23 },
  { day: '11/3', inbox: 12 }, { day: '12/3', inbox: 9 }, { day: '13/3', inbox: 15 }, { day: '14/3', inbox: 7 },
];
const leadByChannel = [
  { name: 'Facebook Page', value: 23, color: '#3b82f6' },
  { name: 'Facebook Group', value: 9, color: '#6366f1' },
  { name: 'Zalo', value: 2, color: '#14b8a6' },
];

function AnalyticsSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-teal-600" /> Bài đăng theo ngày trong tuần
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={weeklyData} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey="posts" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Bài đăng" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <ArrowTrendingUpIcon className="w-4 h-4 text-blue-600" /> Inbox theo ngày
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={inboxData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Line type="monotone" dataKey="inbox" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Tin nhắn" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-purple-600" /> Lead theo kênh
        </h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={140}>
            <PieChart>
              <Pie data={leadByChannel} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={3}>
                {leadByChannel.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {leadByChannel.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">{item.name}</p>
                  <p className="text-xs font-semibold text-slate-900">{item.value} leads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PostManagementPage() {
  const [posts, setPosts] = useState<FacebookPost[]>(mockPosts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (channelFilter && p.channel !== channelFilter) return false;
      if (typeFilter && p.postType !== typeFilter) return false;
      return true;
    });
  }, [posts, search, statusFilter, channelFilter, typeFilter]);

  const kpis = useMemo(() => ({
    total: posts.length,
    thisWeek: posts.filter(p => p.status === 'Đã đăng').length,
    scheduled: posts.filter(p => p.status === 'Đã lên lịch').length,
    totalMessages: posts.reduce((s, p) => s + p.messages, 0),
    leads: posts.reduce((s, p) => s + p.leads, 0),
    converted: posts.reduce((s, p) => s + p.converted, 0),
  }), [posts]);

  const vacantRoomsNoPost = mockRooms.filter(r => r.status === 'Trống' && !r.hasActivePost);

  const handleDelete = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));

  return (
    <AppLayout>
      <div className="fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Quản lý bài đăng</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý bài đăng tuyển khách và hiệu quả marketing</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <KPICard label="Tổng bài đăng" value={kpis.total} icon={<DocumentTextIcon className="w-4 h-4 text-slate-600" />} color="bg-slate-100" />
          <KPICard label="Đã đăng" value={kpis.thisWeek} icon={<PaperAirplaneIcon className="w-4 h-4 text-emerald-600" />} color="bg-emerald-100" />
          <KPICard label="Đang lên lịch" value={kpis.scheduled} icon={<CalendarIcon className="w-4 h-4 text-blue-600" />} color="bg-blue-100" />
          <KPICard label="Tổng tin nhắn" value={kpis.totalMessages} icon={<ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4 text-purple-600" />} color="bg-purple-100" />
          <KPICard label="Lead tiềm năng" value={kpis.leads} icon={<UsersIcon className="w-4 h-4 text-amber-600" />} color="bg-amber-100" />
          <KPICard label="Tỷ lệ chuyển đổi" value={`${kpis.leads > 0 ? Math.round((kpis.converted / kpis.leads) * 100) : 0}%`} icon={<PercentBadgeIcon className="w-4 h-4 text-teal-600" />} color="bg-teal-100" />
        </div>

        {/* Analytics */}
        <AnalyticsSection />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Tìm bài đăng..." />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Tất cả trạng thái</option>
              <option>Nháp</option><option>Đã lên lịch</option><option>Đã đăng</option><option>Lỗi</option>
            </select>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Tất cả kênh</option>
              <option>Facebook Page</option><option>Facebook Group</option><option>Zalo</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Tất cả loại</option>
              <option>Tuyển khách</option><option>Khuyến mãi</option><option>Thông báo</option>
            </select>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1 ml-auto">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><ListBulletIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('card')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'card' ? 'bg-teal-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><Squares2X2Icon className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
              <PlusIcon className="w-4 h-4" /> Tạo bài đăng
            </button>
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {['Tiêu đề', 'Phòng', 'Kênh', 'Loại bài', 'Trạng thái', 'Ngày đăng', 'Lượt xem', 'Tin nhắn', 'Leads', 'Đã chốt', ''].map((h, i) => (
                      <th key={i} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(post => (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="font-medium text-slate-900 truncate">{post.title}</p>
                        {post.fbLink && (
                          <a href={post.fbLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5">
                            <ArrowTopRightOnSquareIcon className="w-2.5 h-2.5" /> Xem bài
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {post.roomCode ? (
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">{post.roomCode}</span>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3"><ChannelBadge channel={post.channel} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{post.postType}</span>
                      </td>
                      <td className="px-4 py-3"><PostStatusBadge status={post.status} /></td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {post.postedDate ? formatDate(post.postedDate) : post.plannedDate ? formatDate(post.plannedDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{post.views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{post.messages}</td>
                      <td className="px-4 py-3 text-amber-600 font-medium">{post.leads}</td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{post.converted}</td>
                      <td className="px-4 py-3">
                        <PostRowActions post={post} onView={() => {}} onEdit={() => {}} onDelete={() => handleDelete(post.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <DocumentTextIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Không tìm thấy bài đăng nào</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
              <p className="text-xs text-slate-500">Hiển thị {filtered.length} / {posts.length} bài đăng</p>
            </div>
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(post => (
              <div key={post.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-28 flex items-center justify-center">
                  <Image size={28} className="text-slate-400" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 flex-1">{post.title}</h3>
                    <PostRowActions post={post} onView={() => {}} onEdit={() => {}} onDelete={() => handleDelete(post.id)} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <PostStatusBadge status={post.status} />
                    <ChannelBadge channel={post.channel} />
                    {post.roomCode && <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">{post.roomCode}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                    <div><p className="text-sm font-bold text-slate-900">{post.views.toLocaleString()}</p><p className="text-[10px] text-slate-400">Lượt xem</p></div>
                    <div><p className="text-sm font-bold text-blue-600">{post.messages}</p><p className="text-[10px] text-slate-400">Tin nhắn</p></div>
                    <div><p className="text-sm font-bold text-amber-600">{post.leads}</p><p className="text-[10px] text-slate-400">Leads</p></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vacant Rooms Section */}
        {vacantRoomsNoPost.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-100 bg-amber-50">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4" /> Bài đăng gợi ý từ phòng trống ({vacantRoomsNoPost.length} phòng chưa có bài đăng)
              </h3>
              <p className="text-xs text-amber-600 mt-0.5">Các phòng đang trống nhưng chưa có bài đăng marketing</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {vacantRoomsNoPost.map(room => (
                <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{room.code} — {room.name}</p>
                    <p className="text-xs text-slate-500">{room.area}m² · {formatCurrency(room.rentPrice)}/tháng · {room.block}</p>
                  </div>
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-3 h-3" /> Tạo bài
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {createOpen && <CreatePostModal onClose={() => setCreateOpen(false)} />}
    </AppLayout>
  );
}
