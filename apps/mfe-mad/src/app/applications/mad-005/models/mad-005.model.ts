/**
 * Represents a data source configuration stored in CONFIG_ORIGEN_DATO.
 *
 * Backend field names are intentionally preserved to avoid mapping
 * existing XTEIN data during the migration.
 */
export interface Mad005DataSourceConfiguration {

  /**
   * Data source configuration identifier.
   */
  ID_ORIGEN_DATO: number;

  /**
   * Data source configuration name.
   */
  NOMBRE: string;

  /**
   * Data source type identifier.
   */
  ORIGEN_DATO: string;

  /**
   * Serialized connection parameters.
   */
  PARAMETROS: string;

  /**
   * Indicates whether this is the default connection.
   */
  DEFECTO: boolean;

  /**
   * Indicates whether the connection is active.
   */
  ACTIVO: boolean;

  /**
   * Optional comments.
   */
  COMENTARIOS?: string | null;
}


/**
 * Represents an available data source type returned by MAD-005.
 *
 * Backend property names are intentionally preserved.
 */
export interface Mad005DataSourceType {

  /**
   * Data source type identifier.
   */
  IdOrigen: string;

  /**
   * Data source type display name.
   */
  Origen: string;
}


/**
 * Represents the response returned by the MAD-005 datalists action.
 */
export interface Mad005DataLists {

  /**
   * Available data source types.
   */
  origenDatos: Mad005DataSourceType[];

  /**
   * Existing backend error message.
   */
  ErrMensaje: string;
}


/**
 * Represents a MAD-005 record returned by the backend.
 */
export interface Mad005DataSourceConfigurationRecord
  extends Mad005DataSourceConfiguration {

  /**
   * Existing backend error message.
   */
  ErrMensaje?: string;

  /**
   * Existing query expression used by search and reporting.
   */
  QFILTRO?: string;
}