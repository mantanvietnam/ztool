// app/layout.tsx
import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

export const metadata: Metadata = {
  // Bạn có thể đưa title và description ra .env (như NEXT_PUBLIC_SEO_TITLE) nếu muốn
  title: process.env.NEXT_PUBLIC_SEO_TITLE || "ZTOOL - Zalo Marketing Automation",
  description: process.env.NEXT_PUBLIC_SEO_DESCRIPTION || "Tiếp cận hàng ngàn khách hàng tiềm năng, tăng trưởng doanh thu vượt bậc bằng cách tự động hóa các tác vụ trên Zalo và Google Maps.",
  icons: {
    // Tích hợp biến Favicon
    icon: process.env.NEXT_PUBLIC_FAVICON_URL || "/favicon.ico",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      {/* Chỉ giữ lại antialiased để làm mượt font, bỏ các biến của font Geist */}
      <body className="antialiased">
        {children}
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-FZNZQSPY29"} />
    </html>
  );
}