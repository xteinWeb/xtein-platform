import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createCal003Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Cal003Service',
  TIPO_ORIGEN: LogOriginType.Application
}, { "Query": "query", "Save": "save", "Support": "support" });
