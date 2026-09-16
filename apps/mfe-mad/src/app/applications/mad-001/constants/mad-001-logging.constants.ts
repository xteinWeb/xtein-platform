import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createMad001Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Mad001Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "Query": "query",
  "Delete": "delete",
  "Save": "save"
});
