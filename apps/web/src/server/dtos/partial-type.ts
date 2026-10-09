type Ctor<T> = new () => T;

/**
 * Cria um DTO parcial a partir de outro: herda os decorators do `class-validator`
 * (via cadeia de protótipos) e marca a classe como parcial. O `parseBody` lê essa
 * marca e valida com `skipMissingProperties`, então campos ausentes deixam de ser
 * obrigatórios — o que é o comportamento esperado de um PATCH.
 *
 * Não depende de `@nestjs/mapped-types` (o projeto não usa mais Nest).
 */
export function PartialType<T extends object>(Base: Ctor<T>): Ctor<Partial<T>> {
  const PartialClass = class extends Base {};
  Object.defineProperty(PartialClass, 'isPartial', { value: true });
  return PartialClass as unknown as Ctor<Partial<T>>;
}

/** Verdadeiro quando o DTO foi criado por `PartialType`. */
export function isPartialDto(dto: unknown): boolean {
  return Boolean(dto && (dto as { isPartial?: boolean }).isPartial);
}
