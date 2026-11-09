'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/components/auth-provider';
import { MobileShell } from '@/components/mobile/mobile-shell';
import { Spinner } from '@/components/ui';

export default function MobileLayout({ children }: { children: ReactNode }): JSX.Element {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.replace('/login');
  }, [loading, session, router]);

  if (loading || !session) return <Spinner />;

  return <MobileShell>{children}</MobileShell>;
}
