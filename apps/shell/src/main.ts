// Guarantee Angular runtime global flags for Native Federation and dev server
(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? false;
(globalThis as any).ngJitMode = (globalThis as any).ngJitMode ?? false;

import {
  initFederation
} from '@angular-architects/native-federation';


/**
 * Initializes the XTEIN Native Federation runtime before
 * bootstrapping Angular.
 *
 * Remote applications are intentionally not registered here.
 *
 * XTEIN resolves microfrontend information dynamically from
 * the application catalog and registers each remote lazily
 * when an application is opened.
 */
initFederation({

})
  .catch(
    error =>
      console.error(
        'XTEIN Native Federation initialization failed.',
        error
      )
  )
  .then(
    () =>
      import(
        './bootstrap'
      )
  )
  .catch(
    error =>
      console.error(
        'XTEIN Shell bootstrap failed.',
        error
      )
  );