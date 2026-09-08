import type { Type } from '@angular/core';

export type McomApplicationLoader = () => Promise<Type<unknown>>;

export interface McomApplicationRegistration {
  readonly applicationId: string;
  readonly load: McomApplicationLoader;
}
