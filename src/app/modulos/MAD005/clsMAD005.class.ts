export interface ConfigOrigenDato {
  ID_ORIGEN_DATO: number;
  NOMBRE: string;
  ORIGEN_DATO: string;
  PARAMETROS: string;
  DEFECTO: boolean;
  ACTIVO: boolean;
  COMENTARIOS?: string | null;
}