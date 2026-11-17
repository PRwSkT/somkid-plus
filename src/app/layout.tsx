import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sukhumvit = localFont({
  src: [
    { path: "../fonts/SukhumvitSet-Thin.ttf", weight: "100", style: "normal" },
    { path: "../fonts/SukhumvitSet-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/SukhumvitSet-Text.ttf", weight: "400", style: "normal" },
    { path: "../fonts/SukhumvitSet-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-sukhumvit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Somkid+ | สถาบันพัฒนาศักยภาพวิชาการและทักษะรอบด้าน",
    template: "%s | Somkid+",
  },
  description:
    "สถาบันการศึกษาเครือสมคิดวิทยา ผสานหลักสูตรวิชาการเชิงลึก คณิตศาสตร์ วิทยาศาสตร์ ภาษาอังกฤษ MEP กีฬา ดนตรี และระบบสอบจำลองวัดระดับ (Diagnostic Mock Exam)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" data-scroll-behavior="smooth" className={`${sukhumvit.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
