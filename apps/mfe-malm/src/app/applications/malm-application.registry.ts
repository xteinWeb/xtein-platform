import type { MalmApplicationRegistration } from '../models/malm-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MalmApplicationRegistry: readonly MalmApplicationRegistration[] = [];

export function findMalmApplication(applicationId: string): MalmApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MalmApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
