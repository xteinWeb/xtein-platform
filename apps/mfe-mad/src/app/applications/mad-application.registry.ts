import {
  Type
} from '@angular/core';

import {
  Mad001Application
} from './mad-001/constants/mad-001.constants';

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
 */
export const MadApplicationRegistry:
  readonly MadApplicationRegistration[] = [

    {
      applicationId:
        Mad001Application.Id,

      load:
        async (): Promise<
          Type<unknown>
        > => {

          const applicationModule =
            await import(
              './mad-001/mad-001.component'
            );

          return applicationModule
            .Mad001Component;
        }
    },


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
 */
export function findMadApplication(
  applicationId:
    string
): MadApplicationRegistration | undefined {

  const normalizedApplicationId =
    applicationId
      ?.trim()
      .toUpperCase();


  if (
    !normalizedApplicationId
  ) {

    return undefined;
  }


  return MadApplicationRegistry
    .find(
      registration =>
        registration.applicationId ===
        normalizedApplicationId
    );
}