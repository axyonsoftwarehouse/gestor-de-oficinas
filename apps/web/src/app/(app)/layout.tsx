'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { Spinner } from '@/components/ui';

export default function AppLayout({ children }: { children: ReactNode }): JSX.Element {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading) return <Spinner />;
  if (!session) return <Spinner />;

  return <AppShell>{children}</AppShell>;
}
