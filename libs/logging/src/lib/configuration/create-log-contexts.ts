import { LogContext } from '../models/log-event.model';

/** Build immutable operation contexts from one owner definition. */
export function createLogContexts<T extends Record<string, string>>(
  owner: Readonly<Omit<LogContext, 'METODO'>>,
  methods: T
): { readonly [K in keyof T]: Readonly<LogContext> } {
  return Object.freeze(Object.fromEntries(
    Object.entries(methods).map(([key, method]) => [key, Object.freeze({ ...owner, METODO: method })])
  )) as { readonly [K in keyof T]: Readonly<LogContext> };
}
