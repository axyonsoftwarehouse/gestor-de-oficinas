'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Button, Modal } from './ui';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  /** `danger` para ações destrutivas (excluir, cancelar). */
  tone?: 'primary' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Substitui `window.confirm` por um diálogo do tema. Uso: `if (await confirm({...}))`. */
export function ConfirmProvider({ children }: { children: ReactNode }): JSX.Element {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(value: boolean): void {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={options !== null}
        onClose={() => settle(false)}
        title={options?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              Voltar
            </Button>
            <Button
              variant={options?.tone === 'danger' ? 'danger' : 'primary'}
              onClick={() => settle(true)}
              autoFocus
            >
              {options?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">
          {options?.description ?? 'Deseja continuar?'}
        </p>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm deve ser usado dentro de ConfirmProvider');
  return context;
}
