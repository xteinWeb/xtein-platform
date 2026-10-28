import type { MfinApplicationRegistration } from '../models/mfin-application-registration.model';
import { Com201Application } from './com-201/constants/com-201.constants';
import { Fin221Application } from './fin-221/constants/fin-221.constants';
import { Fin224Application } from './fin-224/constants/fin-224.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MfinApplicationRegistry: readonly MfinApplicationRegistration[] = [
  {
    applicationId: Com201Application.Id,
    load: async () => (await import('./com-201/com-201.component')).Com201Component
  },
  {
    applicationId: Fin221Application.Id,
    load: async () => (await import('./fin-221/fin-221.component')).Fin221Component
  },
  {
    applicationId: Fin224Application.Id,
    load: async () => (await import('./fin-224/fin-224.component')).Fin224Component
  }
];

export function findMfinApplication(applicationId: string): MfinApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MfinApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
