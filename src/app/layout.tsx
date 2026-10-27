import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Header from '@/app/components/Header';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Deck — Mac Tablet Remote',
  description: 'Control your Mac applications and URLs from your tablet via a physical-keyboard inspired deck.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col blueprint-bg text-slate-100 selection:bg-[#3d8bff]/30 selection:text-white">
        <Header />
        <main className="flex-1 flex flex-col p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
