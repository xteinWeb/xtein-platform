import {
  Injectable
} from '@angular/core';

import {
  RecordToolbarPermissions
} from '@xtein/sdk';

import {
  LegacyRecordToolbarPermissionField
} from '../constants/record-toolbar-backend.constants';


/**
 * Converts the existing XTEIN backend toolbar-permission response
 * into the internal platform permission model.
 *
 * This mapper is the only runtime component that needs to understand
 * legacy fields such as r_nuevo, r_modificar, and r_eliminar.
 */
@Injectable({
  providedIn: 'root'
})
export class RecordToolbarPermissionsMapperService {

  /**
   * Maps a backend response into standard XTEIN toolbar permissions.
   *
   * Missing permission fields are denied by default.
   *
   * @param response Backend response data.
   * @returns Standard XTEIN record-toolbar permissions.
   */
  mapResponse(
    response:
      unknown
  ): RecordToolbarPermissions {

    const record =
      this.parseResponse(
        response
      );

    const errorMessage =
      this.getOptionalString(
        record,
        LegacyRecordToolbarPermissionField.ErrorMessage
      );

    if (errorMessage) {

      throw new Error(
        errorMessage
      );
    }

    return {

      create:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Create
        ),

      edit:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Edit
        ),

      delete:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Delete
        ),

      search:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Search
        ),

      print:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Print
        ),

      configure:
        this.getBoolean(
          record,
          LegacyRecordToolbarPermissionField.Configure
        )
    };
  }


  /**
   * Parses the existing backend response.
   *
   * The current backend returns the permission object serialized
   * inside the data property.
   *
   * @param response Backend data value.
   * @returns Parsed permission record.
   */
  private parseResponse(
    response:
      unknown
  ): Record<
    string,
    unknown
  > {

    let parsedResponse =
      response;

    if (
      typeof parsedResponse ===
        'string'
    ) {

      const value =
        parsedResponse.trim();

      if (!value) {
        return {};
      }

      try {

        parsedResponse =
          JSON.parse(
            value
          );

      } catch {

        throw new Error(
          'The XTEIN record-toolbar permission response contains invalid JSON.'
        );
      }
    }


    /*
     * A missing association means that the user has no explicit
     * permissions for the application.
     *
     * Permissions therefore default to denied.
     */
    if (
      parsedResponse === null ||
      parsedResponse === undefined
    ) {

      return {};
    }


    if (
      typeof parsedResponse !==
        'object' ||
      Array.isArray(
        parsedResponse
      )
    ) {

      throw new Error(
        'The XTEIN record-toolbar permission response must contain an object.'
      );
    }


    return parsedResponse as
      Record<
        string,
        unknown
      >;
  }


  /**
   * Reads a backend permission value as boolean.
   *
   * Missing or unrecognized values are denied by default.
   *
   * @param record Backend permission record.
   * @param fieldName Backend permission field.
   * @returns Normalized permission value.
   */
  private getBoolean(
    record:
      Record<
        string,
        unknown
      >,

    fieldName:
      string
  ): boolean {

    const value =
      record[fieldName];


    if (
      value === true ||
      value === 1
    ) {

      return true;
    }


    if (
      value === false ||
      value === 0 ||
      value === null ||
      value === undefined
    ) {

      return false;
    }


    if (
      typeof value ===
        'string'
    ) {

      const normalizedValue =
        value
          .trim()
          .toLowerCase();

      if (
        normalizedValue ===
          'true' ||
        normalizedValue ===
          '1'
      ) {

        return true;
      }

      if (
        normalizedValue ===
          'false' ||
        normalizedValue ===
          '0' ||
        normalizedValue ===
          ''
      ) {

        return false;
      }
    }


    /*
     * Permissions use a deny-by-default strategy.
     */
    return false;
  }


  /**
   * Reads an optional string value from a backend record.
   *
   * @param record Backend record.
   * @param fieldName Backend field name.
   * @returns Normalized string or undefined.
   */
  private getOptionalString(
    record:
      Record<
        string,
        unknown
      >,

    fieldName:
      string
  ): string | undefined {

    const value =
      record[fieldName];

    if (
      value === null ||
      value === undefined
    ) {

      return undefined;
    }

    const normalizedValue =
      String(
        value
      ).trim();

    return normalizedValue ||
      undefined;
  }
}