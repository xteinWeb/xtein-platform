import type { ProdApplicationRegistration } from '../models/prod-application-registration.model';
import { Pro039Application } from './pro-039/constants/pro-039.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const ProdApplicationRegistry: readonly ProdApplicationRegistration[] = [
  {
    applicationId: Pro039Application.Id,
    load: async () => (await import('./pro-039/pro-039.component')).Pro039Component
  }
];

export function findProdApplication(applicationId: string): ProdApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return ProdApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
