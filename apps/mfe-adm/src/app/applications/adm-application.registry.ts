import type { AdmApplicationRegistration } from '../models/adm-application-registration.model';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const AdmApplicationRegistry: readonly AdmApplicationRegistration[] = [
  { applicationId: 'ADM-300', load: async () => (await import('./adm-300/adm-300.component')).Adm300Component }
];

export function findAdmApplication(applicationId: string): AdmApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return AdmApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
