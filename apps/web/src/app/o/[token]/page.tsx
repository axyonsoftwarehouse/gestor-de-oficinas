import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicQuotation } from '@/server/services/public-quotations.service';
import { PublicQuotationView } from './public-quotation-view';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orçamento · Gestor de Oficinas',
  description: 'Aprove ou recuse o orçamento da sua oficina.',
};

export default async function PublicQuotationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<JSX.Element> {
  const { token } = await params;
  const data = await getPublicQuotation(token).catch(() => null);
  if (!data) notFound();

  return <PublicQuotationView data={data} token={token} />;
}
