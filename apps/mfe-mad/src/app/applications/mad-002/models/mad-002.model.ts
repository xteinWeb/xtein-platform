/**
 * Represents one application node returned by the
 * existing MAD-002 application-tree query.
 *
 * Backend property names are intentionally preserved.
 */
export interface Mad002ApplicationNode {

  /**
   * Unique XTEIN application identifier.
   *
   * For Dashboard and KPI records this identifier is also
   * used to resolve the Dashboard stored by DevExpress.
   */
  ID_APLICACION:
    string;


  /**
   * Parent application identifier.
   */
  ID_APLICACION_PADRE:
    string | null;


  /**
   * Application display name.
   */
  NOMBRE:
    string;


  /**
   * Application type.
   *
   * Typical values include MODULO, DASHBOARD and KPI.
   */
  TIPO:
    string | null;


  /**
   * Application status.
   */
  ESTADO:
    string | null;


  /**
   * Optional system type.
   */
  TIPO_SISTEMA?:
    string | null;


  /**
   * Optional KPI level.
   */
  NIVEL?:
    string | null;


  /**
   * Optional unit of measure.
   */
  UDM?:
    string | null;


  /**
   * Optional lower KPI target.
   */
  META_INFERIOR?:
    number | null;


  /**
   * Optional upper KPI target.
   */
  META_SUPERIOR?:
    number | null;


  /**
   * Optional comments.
   */
  COMENTARIOS?:
    string | null;


  /**
   * Existing backend error message.
   */
  ErrMensaje?:
    string;
}