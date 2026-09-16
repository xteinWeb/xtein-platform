import { DestroyRef, Injectable, NgZone, inject } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { XTEIN_LOGGING_CONFIG } from '../configuration/logging.config';
import { LogContext, LogEvent } from '../models/log-event.model';
import { LoggingQueueService } from './logging-queue.service';
import { LoggingSanitizerService } from './logging-sanitizer.service';

@Injectable({ providedIn: 'root' })
export class LoggingService {
  private readonly config = inject(XTEIN_LOGGING_CONFIG);
  private readonly queue = inject(LoggingQueueService);
  private readonly sanitizer = inject(LoggingSanitizerService);
  private readonly http = new HttpClient(inject(HttpBackend));
  private sending = false;
  constructor() {
    const zone = inject(NgZone);
    const online = () => void this.flush();
    const timer = zone.runOutsideAngular(() => setInterval(online, 30000));
    globalThis.addEventListener?.('online', online);
    inject(DestroyRef).onDestroy(() => { clearInterval(timer); globalThis.removeEventListener?.('online', online); });
    void this.flush();
  }
  error(error: unknown, context: LogContext = {}, details: Record<string, unknown> = {}): void {
    const identity = this.config.identity();
    const sanitized = this.sanitizer.clean({ ...details, DETALLE: error });
    const json = JSON.stringify(sanitized);
    const data = json.length <= 64000 ? sanitized : { DATOS_TRUNCADOS: true, DETALLE: this.sanitizer.clean(error) };
    const event: LogEvent = { ...data as object, ...context, ID_EVENTO: crypto.randomUUID(),
      ENCOLADO_EN: Date.now(), ORIGEN: 'FRONTEND',
      TIPO_ORIGEN: context.TIPO_ORIGEN || (context.ID_APLICACION ? 'APLICACION' : 'PLATAFORMA'),
      EMPRESA: identity?.companyId, USUARIO: identity?.userId,
      MENSAJE: String(this.sanitizer.clean(error instanceof Error ? error.message : typeof error === 'string' ? error : 'Error de plataforma')).slice(0, 4000) };
    void this.queue.put(event).then(() => this.flush()).catch(() => {});
  }
  async flush(): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      const identity = this.config.identity();
      const rows = await this.queue.list();
      for (const row of rows) if (!Number.isFinite(row.ENCOLADO_EN) || Date.now() - row.ENCOLADO_EN > 7 * 86400000) await this.queue.remove(row.ID_EVENTO);
      const events = rows.filter(row => Date.now() - row.ENCOLADO_EN <= 7 * 86400000 &&
        (!row.USUARIO || (row.USUARIO === identity?.userId && row.EMPRESA === identity?.companyId))).slice(0, 20);
      if (!events.length) return;
      const response = await firstValueFrom(this.http.post<{ data: string }>(this.config.endpoint, {
        prmAccion: 'registrar', prmDatos: JSON.stringify({ EVENTOS: events.map(({ ENCOLADO_EN, ...event }) => event) }),
        prmTokenDatos: identity ? { USUARIO: identity.userId, EMPRESA: identity.companyId, TOKEN: identity.token } : undefined
      }).pipe(timeout(10000)));
      const results: { ID_EVENTO: string; DESTINO: string }[] = JSON.parse(response.data);
      for (const result of results) if (events.some(row => row.ID_EVENTO === result.ID_EVENTO) && ['BASE_DATOS', 'ARCHIVO'].includes(result.DESTINO)) await this.queue.remove(result.ID_EVENTO);
    } catch { /* Retry only log delivery, never the original business request. */ }
    finally { this.sending = false; }
  }
}
