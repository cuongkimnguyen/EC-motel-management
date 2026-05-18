import type { Metadata } from 'next';
import '../styles/tailwind.css';

export const metadata: Metadata = {
  title: 'MotelManage — Quản lý nhà trọ thông minh',
  description: 'Hệ thống quản lý nhà trọ, phòng trọ toàn diện cho chủ nhà Việt Nam',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-slate-50 font-sans antialiased">
        {children}
</body>
    </html>
  );
}