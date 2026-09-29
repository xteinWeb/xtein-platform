import { inject } from '@angular/core';
import { createLogContexts, LogOriginType, XTEIN_LOG_SCOPE } from '@xtein/logging';

export const createAdm015Log = () => createLogContexts({
  ...inject(XTEIN_LOG_SCOPE),
  COMPONENTE: 'Adm015Service',
  TIPO_ORIGEN: LogOriginType.Application
}, {
  "Query": "query",
  "Save": "save",
  "Delete": "delete",
  "ChangePassword": "change_password"
});
