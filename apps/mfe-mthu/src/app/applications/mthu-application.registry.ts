import type { MthuApplicationRegistration } from '../models/mthu-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MthuApplicationRegistry: readonly MthuApplicationRegistration[] = [];

export function findMthuApplication(applicationId: string): MthuApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MthuApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
