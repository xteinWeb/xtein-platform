import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggingService } from '../services/logging.service';
@Injectable()
export class LoggingErrorHandler extends ErrorHandler {
  private readonly logging = inject(LoggingService);
  override handleError(error: unknown): void {
    this.logging.error(error, { TIPO_ORIGEN: 'PLATAFORMA' }, { CAPTURADO_POR: '@xtein/logging/LoggingErrorHandler.handleError' });
    super.handleError(error);
  }
}
