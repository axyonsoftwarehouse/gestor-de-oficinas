import type { Metadata } from 'next';
import { APP_NAME } from '@gestor/shared';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} · Administração`,
  description: 'Gestão de oficinas automotivas — SaaS multiempresa.',
};

// Aplica o tema antes da hidratação para evitar "flash" e mismatch.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface-page font-sans text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
