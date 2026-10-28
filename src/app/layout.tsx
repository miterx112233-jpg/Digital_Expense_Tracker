import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Expense Tracker — Minimalist Subscription & Trial Manager",
  description:
    "แอปพลิเคชันสำหรับจัดการ Subscription และติดตามรายจ่ายดิจิทัลรายเดือน พร้อมแจ้งเตือนล่วงหน้าก่อนตัดรอบบิล",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}

