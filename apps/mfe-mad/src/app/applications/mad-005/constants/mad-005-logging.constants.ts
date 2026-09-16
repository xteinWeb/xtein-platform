import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createMad005Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Mad005Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "Query": "query",
  "Save": "save",
  "Delete": "delete"
});
