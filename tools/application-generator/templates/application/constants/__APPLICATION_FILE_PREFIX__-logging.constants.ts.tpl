import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const create__APPLICATION_CLASS_PREFIX__Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: '__APPLICATION_CLASS_PREFIX__Service',
  TIPO_ORIGEN: LogOriginType.Application
}, { Query: 'query', Save: 'save', Delete: 'delete' });
