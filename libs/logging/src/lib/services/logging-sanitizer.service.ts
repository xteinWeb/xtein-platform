import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class LoggingSanitizerService {
  clean(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
    if (depth > 10) return '[MAX_DEPTH]';
    if (value instanceof Error) return this.clean({ name: value.name, message: value.message, stack: value.stack, cause: value.cause }, depth + 1, seen);
    if (typeof value === 'string') {
      if (/^\s*[\[{]/.test(value)) { try { return this.clean(JSON.parse(value), depth + 1, seen); } catch {} }
      return value.replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[TOKEN]')
        .replace(/((?:password|pwd|token|secret|authorization)\s*[=:]\s*)[^\s;,]+/gi, '$1[REDACTED]').slice(0, 16000);
    }
    if (!value || typeof value !== 'object') return value;
    if (value instanceof Blob) return { bytes: value.size, type: value.type };
    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);
    if (Array.isArray(value)) return value.slice(0, 100).map(item => this.clean(item, depth + 1, seen));
    return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [key,
      /token|password|passwd|clave|secret|authorization|cookie|connectionstring|cadena.?conexion/i.test(key) ? '[REDACTED]' : this.clean(item, depth + 1, seen)]));
  }
}
