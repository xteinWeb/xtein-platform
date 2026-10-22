import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createCom208Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Com208Service',
  TIPO_ORIGEN: LogOriginType.Application
}, { "Query": "query", "Save": "save", "Delete": "delete" });
