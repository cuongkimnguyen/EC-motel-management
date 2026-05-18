'use client';

import { ExclamationTriangleIcon, ClockIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { mockContracts } from '@/lib/mockData';
import { useState } from 'react';

export default function ExpiryAlertBanner() {
  const [dismissed, setDismissed] = useState(false);

  const in7 = mockContracts?.filter(c => c?.daysUntilExpiry !== null && c?.daysUntilExpiry <= 7);
  const in15 = mockContracts?.filter(c => c?.daysUntilExpiry !== null && c?.daysUntilExpiry > 7 && c?.daysUntilExpiry <= 15);
  const in30 = mockContracts?.filter(c => c?.daysUntilExpiry !== null && c?.daysUntilExpiry > 15 && c?.daysUntilExpiry <= 30);

  if (dismissed || (in7?.length === 0 && in15?.length === 0 && in30?.length === 0)) return null;

  return (
    <div className="mb-5 space-y-2">
      {in7?.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              🚨 {in7?.length} hợp đồng hết hạn trong 7 ngày tới
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {in7?.map(c => (
                <span key={c?.id} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {c?.roomCode} — {c?.tenantName} ({c?.daysUntilExpiry}d)
                </span>
              ))}
            </div>
          </div>
          <button className="text-xs font-medium text-red-700 hover:text-red-900 flex items-center gap-0.5 flex-shrink-0">
            Gia hạn ngay <ChevronRightIcon className="w-3 h-3" />
          </button>
        </div>
      )}
      {in15?.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ClockIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              ⚠️ {in15?.length} hợp đồng hết hạn trong 8–15 ngày
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {in15?.map(c => (
                <span key={c?.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  {c?.roomCode} — {c?.tenantName} ({c?.daysUntilExpiry}d)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {in30?.length > 0 && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <ClockIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 flex-1">
            <span className="font-semibold">{in30?.length} hợp đồng</span> sắp hết hạn trong 16–30 ngày.
            Hãy liên hệ khách thuê để xác nhận gia hạn sớm.
          </p>
        </div>
      )}
    </div>
  );
}