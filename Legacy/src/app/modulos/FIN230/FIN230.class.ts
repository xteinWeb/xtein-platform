export interface Condicion {
  ID_CONDICION: string;
  ITEM: number;
  ID_CONCEPTO: string;
  VALOR: number;
  PORCENTAJE: number;
  FORMULA: string;
  DESCONTAR_INI: boolean;
  CARGO_CUOTA: boolean;
  IVA: number;
  CLIENTE_PADRE: string;
}
