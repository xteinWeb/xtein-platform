import type { Type } from '@angular/core';

export type ProdApplicationLoader = () => Promise<Type<unknown>>;

export interface ProdApplicationRegistration {
  readonly applicationId: string;
  readonly load: ProdApplicationLoader;
}
