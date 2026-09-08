import type { Type } from '@angular/core';

export type MfinApplicationLoader = () => Promise<Type<unknown>>;

export interface MfinApplicationRegistration {
  readonly applicationId: string;
  readonly load: MfinApplicationLoader;
}
