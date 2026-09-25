import type { McomApplicationRegistration } from '../models/mcom-application-registration.model';
import { Ven230Application } from './ven-230/constants/ven-230.constants';
import { Ven209Application } from './ven-209/constants/ven-209.constants';
import { Ven229Application } from './ven-229/constants/ven-229.constants';
import { Ven212Application } from './ven-212/constants/ven-212.constants';

/** Add only implemented applications, using the same lazy-loading contract as MAD. */
export const McomApplicationRegistry: readonly McomApplicationRegistration[] = [
  {
    applicationId: Ven230Application.Id,
    load: async () => (await import('./ven-230/ven-230.component')).Ven230Component
  },
  {
    applicationId: Ven209Application.Id,
    load: async () => (await import('./ven-209/ven-209.component')).Ven209Component
  },
  {
    applicationId: Ven229Application.Id,
    load: async () => (await import('./ven-229/ven-229.component')).Ven229Component
  },
  {
    applicationId: Ven212Application.Id,
    load: async () => (await import('./ven-212/ven-212.component')).Ven212Component
  },
  {
    applicationId: Ven212Application.AliasId,
    load: async () => (await import('./ven-212/ven-212.component')).Ven212Component
  }
];

export function findMcomApplication(applicationId: string): McomApplicationRegistration | undefined {
  const normalizedId = applicationId?.trim().toUpperCase();
  return McomApplicationRegistry.find(registration => registration.applicationId === normalizedId);
}

