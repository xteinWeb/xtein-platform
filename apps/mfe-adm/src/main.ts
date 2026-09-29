(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? false;
(globalThis as any).ngJitMode = (globalThis as any).ngJitMode ?? false;

import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .then(() => import('./bootstrap'))
  .catch(error => console.error('XTEIN ADM bootstrap failed.', error));
