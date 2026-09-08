import type { Type } from '@angular/core';

export type InvApplicationLoader = () => Promise<Type<unknown>>;

export interface InvApplicationRegistration {
  readonly applicationId: string;
  readonly load: InvApplicationLoader;
}
