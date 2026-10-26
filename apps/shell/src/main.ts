// Guarantee Angular runtime global flags for Native Federation and dev server
(globalThis as any).ngDevMode = (globalThis as any).ngDevMode ?? false;
(globalThis as any).ngJitMode = (globalThis as any).ngJitMode ?? false;

// crypto.randomUUID only exists in secure contexts (HTTPS or localhost). The platform
// is also served over plain HTTP on the LAN (dev2026), where its absence broke the
// bootstrap. getRandomValues is available everywhere; microfrontends share this window.
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  (globalThis.crypto as any).randomUUID = () => {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
}

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