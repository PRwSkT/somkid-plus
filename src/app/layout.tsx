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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        url: "/icon-192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        url: "/icon-512.png",
      },
    ],
  },
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
