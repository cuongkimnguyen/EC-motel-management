import { RoomStatus, ContractStatus, PostStatus, getRoomStatusColor, getContractStatusColor, getPostStatusColor } from '@/lib/mockData';

interface RoomStatusBadgeProps {
  status: RoomStatus;
  size?: 'sm' | 'md';
}

export function RoomStatusBadge({ status, size = 'md' }: RoomStatusBadgeProps) {
  const colorClass = getRoomStatusColor(status);
  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        status === 'Đang thuê' ? 'bg-emerald-500' :
        status === 'Trống' ? 'bg-amber-500' :
        status === 'Đã đặt'? 'bg-blue-500' : 'bg-red-500'
      }`} />
      {status}
    </span>
  );
}

interface ContractStatusBadgeProps {
  status: ContractStatus;
  daysUntilExpiry?: number | null;
  size?: 'sm' | 'md';
}

export function ContractStatusBadge({ status, daysUntilExpiry, size = 'md' }: ContractStatusBadgeProps) {
  const colorClass = getContractStatusColor(status);
  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colorClass} ${sizeClass} whitespace-nowrap`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          status === 'Đang hiệu lực' ? 'bg-emerald-500' :
          status === 'Sắp hết hạn' ? 'bg-amber-500' :
          status === 'Đã hết hạn'? 'bg-red-500' : 'bg-slate-400'
        }`} />
        {status}
      </span>
      {status === 'Sắp hết hạn' && daysUntilExpiry !== null && daysUntilExpiry !== undefined && (
        <span className={`text-[10px] font-medium ${daysUntilExpiry <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
          còn {daysUntilExpiry} ngày
        </span>
      )}
    </div>
  );
}

interface PostStatusBadgeProps {
  status: PostStatus;
  size?: 'sm' | 'md';
}

export function PostStatusBadge({ status, size = 'md' }: PostStatusBadgeProps) {
  const colorClass = getPostStatusColor(status);
  const sizeClass = size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass} whitespace-nowrap`}>
      {status}
    </span>
  );
}