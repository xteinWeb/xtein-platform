import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createCal001Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Cal001Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  Query: 'query',
  Save: 'save',
  Photo: 'photo'
});
