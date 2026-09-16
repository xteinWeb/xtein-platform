import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createDashboardDataLog = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  LIBRERIA: '@xtein/dashboard-runtime',
  COMPONENTE: 'XteinDashboardDataService',
  TIPO_ORIGEN: LogOriginType.Library
}, { Load: 'load', LoadKpis: 'loadKpis' });
