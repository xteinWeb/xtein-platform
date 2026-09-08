import type { Type } from '@angular/core';

export type McprApplicationLoader = () => Promise<Type<unknown>>;

export interface McprApplicationRegistration {
  readonly applicationId: string;
  readonly load: McprApplicationLoader;
}
