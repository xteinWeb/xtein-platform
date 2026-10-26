import type { Type } from '@angular/core';

export type CalApplicationLoader = () => Promise<Type<unknown>>;

export interface CalApplicationRegistration {
  readonly applicationId: string;
  readonly load: CalApplicationLoader;
}
