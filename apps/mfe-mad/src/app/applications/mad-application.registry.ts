import {
  Type
} from '@angular/core';

import {
  Mad005Application
} from './mad-005/constants/mad-005.constants';


/**
 * Loads an Angular application component owned by the
 * MAD microfrontend.
 */
export type MadApplicationLoader =
  () =>
    Promise<
      Type<unknown>
    >;


/**
 * Defines one application registered inside the
 * MAD microfrontend.
 */
export interface MadApplicationRegistration {

  /**
   * Unique XTEIN application identifier.
   */
  applicationId:
    string;

  /**
   * Lazy component loader.
   */
  load:
    MadApplicationLoader;
}


/**
 * Contains all applications currently implemented by
 * the MAD microfrontend.
 *
 * ApplicationHostComponent uses this registry instead
 * of hardcoded switch or if statements.
 */
export const MadApplicationRegistry:
  readonly MadApplicationRegistration[] = [

    {
      applicationId:
        Mad005Application.Id,

      load:
        async (): Promise<
          Type<unknown>
        > => {

          const applicationModule =
            await import(
              './mad-005/mad-005.component'
            );

          return applicationModule
            .Mad005Component;
        }
    }

  ];


/**
 * Resolves an application registered inside the MAD
 * microfrontend.
 *
 * @param applicationId XTEIN application identifier.
 * @returns Registered application or undefined.
 */
export function findMadApplication(
  applicationId:
    string
): MadApplicationRegistration | undefined {

  const normalizedApplicationId =
    applicationId
      ?.trim()
      .toUpperCase();


  if (!normalizedApplicationId) {

    return undefined;
  }


  return MadApplicationRegistry
    .find(
      registration =>
        registration.applicationId ===
        normalizedApplicationId
    );
}