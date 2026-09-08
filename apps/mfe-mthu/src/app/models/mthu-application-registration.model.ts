import type { Type } from '@angular/core';

export type MthuApplicationLoader = () => Promise<Type<unknown>>;

export interface MthuApplicationRegistration {
  readonly applicationId: string;
  readonly load: MthuApplicationLoader;
}
