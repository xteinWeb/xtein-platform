import type { MenApplicationRegistration } from '../models/men-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MenApplicationRegistry: readonly MenApplicationRegistration[] = [];

export function findMenApplication(applicationId: string): MenApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MenApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
