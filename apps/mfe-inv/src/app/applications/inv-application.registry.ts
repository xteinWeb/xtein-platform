import type { InvApplicationRegistration } from '../models/inv-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const InvApplicationRegistry: readonly InvApplicationRegistration[] = [];

export function findInvApplication(applicationId: string): InvApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return InvApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
