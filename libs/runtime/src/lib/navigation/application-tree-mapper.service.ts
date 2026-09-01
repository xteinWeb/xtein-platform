import {
  Injectable
} from '@angular/core';

import {
  ApplicationTreeNode,
  RemoteDescriptor
} from '@xtein/sdk';

/**
 * Field names returned by the existing XTEIN backend.
 *
 * These values represent the external JSON contract and are intentionally
 * isolated from the internal platform model.
 */
const APPLICATION_TREE_FIELDS = {

  applicationId:
    'ID_APLICACION',

  parentApplicationId:
    'ID_APLICACION_PADRE',

  name:
    'NOMBRE',

  type:
    'TIPO',

  icon:
    'ICON',

  tableApplication:
    'TABLA_APLICACION',

  program:
    'PROGRAMA',

  parameters:
    'PARAMETROS',

  comments:
    'COMENTARIOS',

  status:
    'ESTADO',

  action:
    'ACCION',

  lowerTarget:
    'META_INFERIOR',

  upperTarget:
    'META_SUPERIOR',

  systemType:
    'TIPO_SISTEMA',

  unitOfMeasure:
    'UDM',

  level:
    'NIVEL',

  microfrontendId:
    'MICROFRONTEND_ID',

  microfrontendName:
    'MICROFRONTEND_NAME',

  remoteName:
    'REMOTE_NAME',

  exposedModule:
    'EXPOSED_MODULE',

  remoteEntryUrl:
    'REMOTE_ENTRY_URL',

  microfrontendVersion:
    'MICROFRONTEND_VERSION',

  microfrontendStatus:
    'MICROFRONTEND_STATUS',

  errorMessage:
    'ErrMensaje'

} as const;

/**
 * Converts the existing XTEIN backend application tree response
 * into the internal platform navigation model.
 *
 * This service is the only runtime component that knows the property
 * names returned by the existing backend JSON contract.
 */
@Injectable({
  providedIn: 'root'
})
export class ApplicationTreeMapperService {

  /**
   * Maps a complete backend application tree response.
   *
   * The method supports both an already parsed JSON array and a JSON string.
   *
   * @param response Backend application tree response.
   * @returns Application tree nodes used internally by the platform.
   */
  mapResponse(
    response: unknown
  ): readonly ApplicationTreeNode[] {

    const items =
      this.parseResponse(
        response
      );

    this.validateBackendResponse(
      items
    );

    const mappedItems =
      items.map(
        item =>
          this.mapItem(item)
      );

    return this.removeDuplicateApplications(
      mappedItems
    );
  }

  /**
   * Maps one backend application tree item.
   *
   * @param item Backend application tree item.
   * @returns Internal XTEIN application tree node.
   */
  mapItem(
    item: Record<string, unknown>
  ): ApplicationTreeNode {

    const applicationId =
      this.getRequiredString(
        item,
        APPLICATION_TREE_FIELDS.applicationId
      );

    const name =
      this.getRequiredString(
        item,
        APPLICATION_TREE_FIELDS.name
      );

    const type =
      this.getRequiredString(
        item,
        APPLICATION_TREE_FIELDS.type
      )
        .toLowerCase();

    const status =
      this.getRequiredValueAsString(
        item,
        APPLICATION_TREE_FIELDS.status
      );

    return {

      applicationId,

      parentApplicationId:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.parentApplicationId
        ),

      name,

      type,

      status,

      icon:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.icon
        ),

      tableApplication:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.tableApplication
        ),

      program:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.program
        ),

      parameters:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.parameters
        ),

      comments:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.comments
        ),

      action:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.action
        ),

      lowerTarget:
        this.getOptionalNumber(
          item,
          APPLICATION_TREE_FIELDS.lowerTarget
        ),

      upperTarget:
        this.getOptionalNumber(
          item,
          APPLICATION_TREE_FIELDS.upperTarget
        ),

      systemType:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.systemType
        ),

      unitOfMeasure:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.unitOfMeasure
        ),

      level:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.level
        ),

      remote:
        this.mapRemote(
          item
        )

    };
  }

  /**
   * Converts the backend response into an array of records.
   *
   * @param response Raw backend response.
   * @returns Parsed backend application tree items.
   * @throws Error when the response is not a valid JSON array.
   */
  private parseResponse(
    response: unknown
  ): readonly Record<string, unknown>[] {

    let parsedResponse =
      response;

    if (
      typeof response === 'string'
    ) {

      const serializedResponse =
        response.trim();

      if (!serializedResponse) {
        return [];
      }

      try {

        parsedResponse =
          JSON.parse(
            serializedResponse
          );

      } catch (cause) {

        throw new Error(
          'The XTEIN application tree response contains invalid JSON.',
          {
            cause
          }
        );
      }
    }

    if (
      !Array.isArray(
        parsedResponse
      )
    ) {

      throw new Error(
        'The XTEIN application tree response must be a JSON array.'
      );
    }

    return parsedResponse.map(
      (
        item,
        index
      ) => {

        if (
          item === null ||
          typeof item !== 'object' ||
          Array.isArray(item)
        ) {

          throw new Error(
            `Invalid XTEIN application tree item at index ${index}.`
          );
        }

        return item as
          Record<string, unknown>;
      }
    );
  }

  /**
   * Validates functional backend errors returned inside the application
   * tree response.
   *
   * @param items Parsed backend application-tree items.
   */
  private validateBackendResponse(
    items:
      readonly Record<string, unknown>[]
  ): void {

    for (
      const item of items
    ) {

      const errorMessage =
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.errorMessage
        );

      if (!errorMessage) {
        continue;
      }

      throw new Error(
        errorMessage
      );
    }
  }

  /**
   * Creates the microfrontend descriptor associated with an application.
   *
   * Applications without MICROFRONTEND_ID are considered applications
   * without microfrontend configuration and therefore do not receive
   * a remote descriptor.
   *
   * @param item Backend application tree item.
   * @returns Remote descriptor when configured; otherwise undefined.
   */
  private mapRemote(
    item: Record<string, unknown>
  ): RemoteDescriptor | undefined {

    const microfrontendId =
      this.getOptionalString(
        item,
        APPLICATION_TREE_FIELDS.microfrontendId
      );

    if (!microfrontendId) {
      return undefined;
    }

    const microfrontendStatus =
      this.getRequiredString(
        item,
        APPLICATION_TREE_FIELDS.microfrontendStatus
      );

    return {

      microfrontendId,

      name:
        this.getRequiredString(
          item,
          APPLICATION_TREE_FIELDS.microfrontendName
        ),

      remoteName:
        this.getRequiredString(
          item,
          APPLICATION_TREE_FIELDS.remoteName
        ),

      exposedModule:
        this.getRequiredString(
          item,
          APPLICATION_TREE_FIELDS.exposedModule
        ),

      remoteEntryUrl:
        this.getRequiredString(
          item,
          APPLICATION_TREE_FIELDS.remoteEntryUrl
        ),

      version:
        this.getOptionalString(
          item,
          APPLICATION_TREE_FIELDS.microfrontendVersion
        ),

      enabled:
        this.isEnabledStatus(
          microfrontendStatus
        )

    };
  }

  /**
   * Removes duplicated application identifiers from the application tree.
   *
   * DevExtreme TreeView requires unique keys.
   *
   * @param items Normalized application tree nodes.
   * @returns Application tree without duplicate application identifiers.
   */
  private removeDuplicateApplications(
    items:
      readonly ApplicationTreeNode[]
  ): readonly ApplicationTreeNode[] {

    const applications =
      new Map<
        string,
        ApplicationTreeNode
      >();

    for (
      const item of items
    ) {

      const applicationId =
        item.applicationId
          .trim()
          .toUpperCase();

      if (
        !applicationId ||
        applications.has(
          applicationId
        )
      ) {
        continue;
      }

      applications.set(
        applicationId,
        {
          ...item,
          applicationId
        }
      );
    }

    return Array.from(
      applications.values()
    );
  }

  /**
   * Determines whether a microfrontend status represents
   * an enabled remote.
   *
   * @param status Backend microfrontend status.
   * @returns True when the remote is enabled.
   */
  private isEnabledStatus(
    status: string
  ): boolean {

    const normalizedStatus =
      status
        .trim()
        .toUpperCase();

    return (
      normalizedStatus === 'ACTIVE' ||
      normalizedStatus === 'ACTIVO' ||
      normalizedStatus === 'ENABLED' ||
      normalizedStatus === 'A' ||
      normalizedStatus === '1' ||
      normalizedStatus === 'TRUE'
    );
  }

  /**
   * Returns a required string property.
   *
   * @param item Source record.
   * @param fieldName External JSON field name.
   * @returns String value.
   * @throws Error when the field is missing or empty.
   */
  private getRequiredString(
    item: Record<string, unknown>,
    fieldName: string
  ): string {

    const value =
      item[fieldName];

    if (
      typeof value !== 'string' ||
      value.trim().length === 0
    ) {

      throw new Error(
        `The XTEIN application tree field "${fieldName}" is required.`
      );
    }

    return value.trim();
  }

  /**
   * Returns a required value converted to string.
   *
   * This is used for backend fields whose database representation may
   * be string, number, or boolean while the platform model uses string.
   *
   * @param item Source record.
   * @param fieldName External JSON field name.
   * @returns Normalized string value.
   */
  private getRequiredValueAsString(
    item: Record<string, unknown>,
    fieldName: string
  ): string {

    const value =
      item[fieldName];

    if (
      value === null ||
      value === undefined
    ) {

      throw new Error(
        `The XTEIN application tree field "${fieldName}" is required.`
      );
    }

    const normalizedValue =
      String(value)
        .trim();

    if (!normalizedValue) {

      throw new Error(
        `The XTEIN application tree field "${fieldName}" is required.`
      );
    }

    return normalizedValue;
  }

  /**
   * Returns an optional string property.
   *
   * Empty strings and textual NULL values are converted to undefined.
   *
   * @param item Source record.
   * @param fieldName External JSON field name.
   * @returns String value or undefined.
   */
  private getOptionalString(
    item: Record<string, unknown>,
    fieldName: string
  ): string | undefined {

    const value =
      item[fieldName];

    if (
      value === null ||
      value === undefined
    ) {
      return undefined;
    }

    const normalizedValue =
      String(value)
        .trim();

    if (
      !normalizedValue ||
      normalizedValue.toUpperCase() ===
        'NULL'
    ) {
      return undefined;
    }

    return normalizedValue;
  }

  /**
   * Returns an optional numeric property.
   *
   * @param item Source record.
   * @param fieldName External JSON field name.
   * @returns Numeric value or undefined.
   * @throws Error when a non-numeric value is received.
   */
  private getOptionalNumber(
    item: Record<string, unknown>,
    fieldName: string
  ): number | undefined {

    const value =
      item[fieldName];

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return undefined;
    }

    const numericValue =
      Number(value);

    if (
      !Number.isFinite(
        numericValue
      )
    ) {

      throw new Error(
        `The XTEIN application tree field "${fieldName}" must contain a numeric value.`
      );
    }

    return numericValue;
  }
}