import type { MfinApplicationRegistration } from '../models/mfin-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MfinApplicationRegistry: readonly MfinApplicationRegistration[] = [];

export function findMfinApplication(applicationId: string): MfinApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MfinApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
