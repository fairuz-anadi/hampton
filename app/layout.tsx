import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Markable — Fairer grading. Clearer feedback. Better teaching.',
  description:
    'Grading should not end with a number. Markable helps faculty understand how they grade, why students lose marks, and what the results reveal about their class.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
