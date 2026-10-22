import type { ProdApplicationRegistration } from '../models/prod-application-registration.model';
import { Com208Application } from './com-208/constants/com-208.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const ProdApplicationRegistry: readonly ProdApplicationRegistration[] = [
  {
    applicationId: Com208Application.Id,
    load: async () => (await import('./com-208/com-208.component')).Com208Component
  }
];

export function findProdApplication(applicationId: string): ProdApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return ProdApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
