'use client';

import { SparklesIcon } from '@heroicons/react/24/outline';

const capabilities = [
  {
    emoji: '🏠',
    title: 'Quản lý vận hành',
    items: ['Theo dõi phòng trống', 'Phát hiện vấn đề cần xử lý', 'Tóm tắt tình hình nhà trọ'],
    color: 'border-blue-200 bg-blue-50/50',
    titleColor: 'text-blue-700',
  },
  {
    emoji: '👤',
    title: 'Quản lý khách thuê',
    items: ['Kiểm tra công nợ', 'Theo dõi hợp đồng', 'Gợi ý follow-up'],
    color: 'border-teal-200 bg-teal-50/50',
    titleColor: 'text-teal-700',
  },
  {
    emoji: '💰',
    title: 'Quản lý tài chính',
    items: ['Tóm tắt chi phí', 'Phát hiện biến động bất thường', 'Hỗ trợ báo cáo'],
    color: 'border-emerald-200 bg-emerald-50/50',
    titleColor: 'text-emerald-700',
  },
  {
    emoji: '📢',
    title: 'Marketing',
    items: ['Gợi ý nội dung bài đăng', 'Nhắc đăng lại phòng trống', 'Hỗ trợ mô tả phòng'],
    color: 'border-purple-200 bg-purple-50/50',
    titleColor: 'text-purple-700',
  },
  {
    emoji: '⚡',
    title: 'Tự động hóa',
    items: ['Nhắc việc định kỳ', 'Chạy báo cáo tự động', 'Cảnh báo sự kiện bất thường'],
    color: 'border-amber-200 bg-amber-50/50',
    titleColor: 'text-amber-700',
  },
];

export default function AgentCapabilitiesSection() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <SparklesIcon className="w-5 h-5 text-purple-500" />
        <h3 className="text-sm font-semibold text-slate-900">Agent có thể hỗ trợ gì?</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {capabilities?.map((cap) => (
          <div key={cap?.title} className={`rounded-xl border p-4 ${cap?.color}`}>
            <div className="text-2xl mb-2">{cap?.emoji}</div>
            <p className={`text-sm font-semibold mb-2 ${cap?.titleColor}`}>{cap?.title}</p>
            <ul className="space-y-1">
              {cap?.items?.map((item) => (
                <li key={item} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="text-slate-400 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
