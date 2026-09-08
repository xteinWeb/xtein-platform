import type { AdmApplicationRegistration } from '../models/adm-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const AdmApplicationRegistry: readonly AdmApplicationRegistration[] = [];

export function findAdmApplication(applicationId: string): AdmApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return AdmApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
