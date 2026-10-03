'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wrench } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Button, Card, ErrorText, Field, Input } from '@/components/ui';

export default function LoginPage(): JSX.Element {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('owner@oficina.local');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white">
            <Wrench size={20} />
          </span>
          <div className="text-center">
            <div className="text-lg font-semibold text-ink">Gestor de Oficinas</div>
            <div className="text-sm text-ink-muted">Acesse o painel administrativo</div>
          </div>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Senha">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <ErrorText>{error}</ErrorText>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Demo: owner@oficina.local / password
        </p>
      </div>
    </div>
  );
}
