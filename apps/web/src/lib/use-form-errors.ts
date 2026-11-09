import { useCallback, useState, type FocusEvent } from 'react';

/**
 * Decide quando exibir os erros de validação: depois que o campo perde o foco
 * ou depois de uma tentativa de salvar — nunca enquanto a pessoa ainda digita.
 * Os inputs precisam de `name` igual à chave do erro.
 */
export function useFormErrors<K extends string>(
  errors: Partial<Record<K, string>>,
): {
  errorFor: (key: K) => string | undefined;
  onBlur: (event: FocusEvent<HTMLFormElement>) => void;
  /** Chame no submit; devolve `true` se pode seguir. */
  attempt: () => boolean;
  reset: () => void;
} {
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const onBlur = useCallback((event: FocusEvent<HTMLFormElement>) => {
    // O blur dos campos borbulha até o form; `target` é o campo que perdeu o foco.
    const target: EventTarget = event.target;
    const name = target instanceof Element ? target.getAttribute('name') : null;
    if (name) setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }, []);

  return {
    errorFor: (key) => (submitted || touched[key] ? errors[key] : undefined),
    onBlur,
    attempt: () => {
      setSubmitted(true);
      return Object.values(errors).every((message) => !message);
    },
    reset: () => {
      setTouched({});
      setSubmitted(false);
    },
  };
}
