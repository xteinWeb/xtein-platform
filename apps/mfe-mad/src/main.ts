(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? false;
(globalThis as any).ngJitMode = (globalThis as any).ngJitMode ?? false;

import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch(err => console.error(err))
  .then(_ => import('./bootstrap'))
  .catch(err => console.error(err));
