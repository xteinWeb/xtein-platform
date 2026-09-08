import type { Type } from '@angular/core';

export type MenApplicationLoader = () => Promise<Type<unknown>>;

export interface MenApplicationRegistration {
  readonly applicationId: string;
  readonly load: MenApplicationLoader;
}
