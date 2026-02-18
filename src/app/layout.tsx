
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Yukidouji Note Search',
  description: 'Full-text search engine for Note articles by @yukidouji',
  openGraph: {
    title: 'Yukidouji Note Search',
    description: 'Search Antigravity, AI, and Engineering articles.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Note Search Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yukidouji Note Search',
    description: 'Search Antigravity, AI, and Engineering articles.',
    images: ['/api/og'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
