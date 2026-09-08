import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .then(() => import('./bootstrap'))
  .catch(error => console.error('XTEIN MALM bootstrap failed.', error));
