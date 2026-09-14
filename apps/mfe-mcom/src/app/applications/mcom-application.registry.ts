import type { McomApplicationRegistration } from '../models/mcom-application-registration.model';
import { Ven230Application } from './ven-230/constants/ven-230.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const McomApplicationRegistry: readonly McomApplicationRegistration[] = [
  {
    applicationId: Ven230Application.Id,
    load: async () => (await import('./ven-230/ven-230.component')).Ven230Component
  }
];

export function findMcomApplication(applicationId: string): McomApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return McomApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}

