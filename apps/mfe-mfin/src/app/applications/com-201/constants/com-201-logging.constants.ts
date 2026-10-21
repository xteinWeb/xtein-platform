import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createCom201Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Com201Service',
  TIPO_ORIGEN: LogOriginType.Application
}, { Query: 'query', Save: 'save', Delete: 'delete' });
