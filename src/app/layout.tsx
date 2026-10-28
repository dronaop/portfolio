import type { Metadata } from "next";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "Deepanshu Singh — AI/ML Developer",
  description: "Portfolio of Deepanshu Singh, AI/ML Developer building LLM pipelines and fine-tuned models.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#05060a]">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
