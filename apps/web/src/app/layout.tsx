import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { APP_NAME } from '@gestor/shared';
import { Providers } from '@/components/providers';
import './globals.css';

// Auto-hospedada no build: sem requisição ao Google Fonts em runtime.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: `${APP_NAME} · Administração`,
  description: 'Gestão de oficinas automotivas — SaaS multiempresa.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Oficina',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2f80ed',
};

// Aplica o tema antes da hidratação para evitar "flash" e mismatch.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface-page font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
