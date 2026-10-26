import type { CalApplicationRegistration } from '../models/cal-application-registration.model';
import { Cal001Application } from './cal-001/constants/cal-001.constants';

/** Solo aplicaciones implementadas, con el mismo contrato de carga diferida que mfe-prod. */
export const CalApplicationRegistry: readonly CalApplicationRegistration[] = [
  {
    applicationId: Cal001Application.Id,
    load: async () => (await import('./cal-001/cal-001.component')).Cal001Component
  }
];

export function findCalApplication(applicationId: string): CalApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return CalApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}
