/**
 * Represents one XTEIN application stored in
 * APLICACIONES_ASOCIADAS.
 *
 * Existing backend property names are intentionally preserved.
 */
export interface Mad001ApplicationRecord {

  ID_APLICACION:
    string;

  ID_APLICACION_PADRE:
    string | null;

  NOMBRE:
    string;

  TIPO:
    string | null;

  COMENTARIOS:
    string | null;

  ESTADO:
    string | null;

  ACCION:
    string | null;

  META_INFERIOR:
    number | null;

  META_SUPERIOR:
    number | null;

  UDM:
    string | null;

  NIVEL:
    string | null;

  DIRECTORIO?:
    string | null;

  PROGRAMA?:
    string | null;

  FECHA_VIGENCIA?:
    string | null;

  PARAMETROS?:
    string | null;

  TABLA_APLICACION?:
    string | null;

  GENERA?:
    boolean | null;

  IMAGEN_URL?:
    string | null;

  TIPO_SISTEMA?:
    string | null;

  MICROFRONTEND_ID?:
    string | null;

  DEFECTO?:
    boolean | null;

  ErrMensaje?:
    string;

  QFILTRO?:
    string;
}


/**
 * Parent application option returned by the backend.
 */
export interface Mad001ParentApplication {

  ID_APLICACION:
    string;

  APLICACION:
    string;
}


/**
 * Unit-of-measure option.
 */
export interface Mad001UnitOfMeasure {

  ID_UDM:
    string;

  NOMBRE:
    string;
}


/**
 * MAD-001 lookup collection.
 */
export interface Mad001DataLists {

  udm:
    Mad001UnitOfMeasure[];

  tipo:
    string[];

  estado:
    string[];

  tipoSistema:
    string[];

  accion:
    string[];

  nivel:
    string[];

  ErrMensaje:
    string;
}