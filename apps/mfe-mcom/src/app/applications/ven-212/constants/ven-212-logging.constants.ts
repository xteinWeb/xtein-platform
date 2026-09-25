import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createVen212Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Ven212Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "Query": "query",
  "Save": "save",
  "Delete": "delete",
  "Electronic": "electronicDocument"
});
