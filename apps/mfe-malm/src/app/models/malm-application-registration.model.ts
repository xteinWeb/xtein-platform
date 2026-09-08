import type { Type } from '@angular/core';

export type MalmApplicationLoader = () => Promise<Type<unknown>>;

export interface MalmApplicationRegistration {
  readonly applicationId: string;
  readonly load: MalmApplicationLoader;
}
