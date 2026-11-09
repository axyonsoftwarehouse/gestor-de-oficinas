import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sem conexão · Gestor de Oficinas',
};

export default function OfflinePage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-ink-muted shadow-card">
          <WifiOff size={26} />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Você está sem conexão</h1>
        <p className="mt-2 text-sm text-ink-muted">
          O app guarda os últimos dados no aparelho. Abra o app para continuar de onde
          parou — as operações feitas agora são enviadas quando a internet voltar.
        </p>
        <Link
          href="/m/hoje"
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand text-base font-semibold text-white"
        >
          Abrir o app
        </Link>
      </div>
    </div>
  );
}
