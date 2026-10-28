import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createFin224Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Fin224Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  Query: 'query',
  Save: 'save',
  Delete: 'delete',
  Catalog: 'catalog'
});
