import type { MthuApplicationRegistration } from '../models/mthu-application-registration.model';
import { Ghu250Application } from './ghu-250/constants/ghu-250.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const MthuApplicationRegistry: readonly MthuApplicationRegistration[] = [
  {
    applicationId: Ghu250Application.Id,
    load: async () => (await import('./ghu-250/ghu-250.component')).Ghu250Component
  }
];

export function findMthuApplication(applicationId: string): MthuApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return MthuApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
