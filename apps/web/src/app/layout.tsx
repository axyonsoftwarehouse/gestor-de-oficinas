import type { Metadata } from 'next';
import { APP_NAME } from '@gestor/shared';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: `${APP_NAME} · Administração`,
  description: 'Gestão de oficinas automotivas — SaaS multiempresa.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
