import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createMad002Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Mad002Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "GetApplicationTree": "getApplicationTree"
});
