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