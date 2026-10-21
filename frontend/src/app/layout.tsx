import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BanglaShield — AI Cybersecurity & Phishing Detection Platform',
  description: 'AI-powered phishing and scam detection platform tailored for regional threat vectors in Bangladesh.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-full flex flex-col bg-[#070b14] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
