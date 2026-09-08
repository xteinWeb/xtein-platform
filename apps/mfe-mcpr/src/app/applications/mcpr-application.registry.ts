import type { McprApplicationRegistration } from '../models/mcpr-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const McprApplicationRegistry: readonly McprApplicationRegistration[] = [];

export function findMcprApplication(applicationId: string): McprApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return McprApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
