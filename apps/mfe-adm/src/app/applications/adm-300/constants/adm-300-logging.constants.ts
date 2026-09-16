import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createAdm300Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'TableroDataService',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "LoadApplications": "loadApplications"
});
