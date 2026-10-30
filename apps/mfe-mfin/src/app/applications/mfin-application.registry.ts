import type { MfinApplicationRegistration } from '../models/mfin-application-registration.model';
import { Com201Application } from './com-201/constants/com-201.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MfinApplicationRegistry: readonly MfinApplicationRegistration[] = [
  {
    applicationId: Com201Application.Id,
    load: async () => (await import('./com-201/com-201.component')).Com201Component
  }
];

export function findMfinApplication(applicationId: string): MfinApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MfinApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
