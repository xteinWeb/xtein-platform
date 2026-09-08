import type { McomApplicationRegistration } from '../models/mcom-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const McomApplicationRegistry: readonly McomApplicationRegistration[] = [];

export function findMcomApplication(applicationId: string): McomApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return McomApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
