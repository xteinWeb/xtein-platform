import type { Type } from '@angular/core';

export type AdmApplicationLoader = () => Promise<Type<unknown>>;

export interface AdmApplicationRegistration {
  readonly applicationId: string;
  readonly load: AdmApplicationLoader;
}
